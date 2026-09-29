from collections import defaultdict

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status

# import models
from .models import Assignment, FileComparisonModel, AIDetection, TxtFileModel, OcrResult

# import serializers
from .serializers import (
    AIDetectionSerializer, AssignmentSerializer, FileModelSerializer, OcrResultSerializer, UserSerializer,
)
from .similarity import class_median, recompute_assignment, similarity_level, submission_text

# AI-detection scores on shorter answers than this are mostly noise.
LOW_CONFIDENCE_WORDS = 100


def user_data(user):
    return UserSerializer(user).data if user else None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file(request):
    # Deserialize the request data using a serializer
    serializer = FileModelSerializer(data=request.data)

    # Validate the deserialized data
    if serializer.is_valid():
        # Create and save the FileModel instance, owned by whoever is logged in
        serializer.save(uploaded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def assignments(request):
    if request.method == 'POST':
        if not request.user.is_staff:
            return Response({"detail": "Only professors can create assignments."}, status=status.HTTP_403_FORBIDDEN)
        serializer = AssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    queryset = Assignment.objects.order_by('-created_on')
    if request.user.is_staff:
        return Response(AssignmentSerializer(queryset, many=True).data)
    # Students only need to pick one; the reference text may be a model answer.
    return Response([{"id": a.id, "title": a.title} for a in queryset])


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def assignment_detail(request, pk):
    assignment = get_object_or_404(Assignment, pk=pk)
    serializer = AssignmentSerializer(assignment, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    # Changing the question paper changes which phrases are ignored.
    recompute_assignment(assignment.pk)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])  # staff only; send the login JWT as a Bearer token
def list_files_for_teacher(request):
    files = TxtFileModel.objects.select_related('uploaded_by', 'submission__assignment')
    assignment = request.query_params.get('assignment')
    if assignment == 'none':
        files = files.filter(submission__assignment__isnull=True)
    elif assignment:
        files = files.filter(submission__assignment_id=assignment)
    files = list(files)
    submission_ids = [f.submission_id for f in files if f.submission_id]

    # Closest match per file. Comparisons are stored in both directions,
    # so every file has its own rows as uploaded_file.
    closest = {}
    comparisons = FileComparisonModel.objects.filter(uploaded_file__in=files).select_related('other_file__uploaded_by')
    for comparison in comparisons:
        best = closest.get(comparison.uploaded_file_id)
        if best is None or comparison.similarity_result > best.similarity_result:
            closest[comparison.uploaded_file_id] = comparison

    # Latest AI result and transcription for each submission (ordered, so later rows win).
    ai_results = {d.image.pdfFile_id: d for d in
                  AIDetection.objects.filter(image__pdfFile_id__in=submission_ids).select_related('image').order_by('id')}
    transcripts = {o.submission_id: o.ocr_results for o in
                   OcrResult.objects.filter(submission_id__in=submission_ids).order_by('id')}

    # A score is only meaningful next to what's normal for that assignment.
    group_scores = defaultdict(list)
    for f in files:
        group_scores[f.submission.assignment_id if f.submission_id else None].append(
            closest[f.pk].similarity_result if f.pk in closest else 0.0)
    medians = {group: class_median(scores) for group, scores in group_scores.items()}

    file_data = []
    for f in files:
        assignment_obj = f.submission.assignment if f.submission_id else None
        median = medians[assignment_obj.pk if assignment_obj else None]
        match = closest.get(f.pk)
        score = match.similarity_result if match else 0.0
        ai = ai_results.get(f.submission_id)
        words = len(transcripts.get(f.submission_id, "").split())

        file_data.append({
            'id': f.pk,
            'submission_id': f.submission_id,
            'filename': f.filename,
            'description': f.description,
            'uploaded_by': user_data(f.uploaded_by),
            'assignment': {'id': assignment_obj.pk, 'title': assignment_obj.title} if assignment_obj else None,
            'ai_score': ai.detection_results_AI if ai else None,
            'ai_confidence': 'low' if words < LOW_CONFIDENCE_WORDS else 'normal',
            'word_count': words,
            'max_similarity': round(score * 100, 2),
            'similarity_level': similarity_level(score, median),
            'class_median_similarity': round(median * 100, 2),
            'closest': {
                'id': match.other_file_id,
                'filename': match.other_file.filename,
                'uploaded_by': user_data(match.other_file.uploaded_by),
                'passages': len(match.matches.get('self', [])),
            } if match and score > 0 else None,
        })

    return Response({'file_data': file_data})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def similarity_detail(request, pk):
    """One submission's text next to its closest matches, with the shared passages marked."""
    row = get_object_or_404(TxtFileModel.objects.select_related('uploaded_by'), pk=pk)
    comparisons = (FileComparisonModel.objects.filter(uploaded_file=row, similarity_result__gt=0)
                   .select_related('other_file__uploaded_by').order_by('-similarity_result')[:3])
    return Response({
        'id': row.pk,
        'filename': row.filename,
        'uploaded_by': user_data(row.uploaded_by),
        'text': submission_text(row),
        'matches': [{
            'id': c.other_file_id,
            'filename': c.other_file.filename,
            'uploaded_by': user_data(c.other_file.uploaded_by),
            'similarity': round(c.similarity_result * 100, 2),
            'spans': c.matches.get('self', []),
            'other_text': submission_text(c.other_file),
            'other_spans': c.matches.get('other', []),
        } for c in comparisons],
    })


@api_view(['POST', 'GET'])
def AIContentDectection(request):
    # Query all records from the AIDetection model
    detection_records = AIDetection.objects.all()

    # Serialize the queryset
    serializer = AIDetectionSerializer(detection_records, many=True)

    return Response(serializer.data)


@api_view(['POST'])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')

    user = authenticate(request, email=email, password=password)
    if user is not None:
        login(request, user)
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # Return tokens in the response
        response_data = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "is_staff": user.is_staff,  # Include the is_staff value
        }

        response = Response(response_data)
        response["Access-Control-Allow-Credentials"] = "true"
        return response
    else:
        return Response({"error": "Login failed"}, status=400)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def ocr_Results(request, pk):
    # pk is the processed submission's id (a row of the teacher files list).
    row = get_object_or_404(TxtFileModel, pk=pk)
    ocr_result = (OcrResult.objects.filter(submission_id=row.submission_id).order_by('-id').first()
                  if row.submission_id else None)
    if ocr_result is None:
        return Response({"detail": "No transcription for this submission."}, status=status.HTTP_404_NOT_FOUND)

    serializer = OcrResultSerializer(ocr_result)
    return Response(serializer.data)
