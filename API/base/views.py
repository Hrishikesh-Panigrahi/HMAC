from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Max
from rest_framework import status

# import models
from .models import FileModel, FileComparisonModel, AIDetection, TxtFileModel, User, OcrResult

# import serializers
from .serializers import FileSerializer, AIDetectionSerializer, OcrResultSerializer, FileModelSerializer


# @api_view(['POST'])
# def upload_file(request):
#     filename = request.data.get('selectedFile')
#     description = request.data.get('desc')
#     file = request.data.get('file')


#     # file_model = FileModel(
#     #     filename=filename, description=description, file=file)
#     # file_model.save()

@api_view(['POST'])
def upload_file(request):
    # Deserialize the request data using a serializer
    serializer = FileModelSerializer(data=request.data)
    
    # Validate the deserialized data
    if serializer.is_valid():
        # Create and save the FileModel instance
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def list_files_for_teacher(request):
    serializer = None
    # if request.user.is_staff:   #isko baadmai karte
    files = TxtFileModel.objects.all()
    max_similarities = {}
    other_file_info = {}
    aidetection_results = {}

    # Calculating the maximum similarity for each file
    for file in files:
        # Using an aggregation query to find the maximum similarity for this file
        max_similarity = FileComparisonModel.objects.filter(uploaded_file=file).aggregate(
            Max('similarity_result'))['similarity_result__max']

        similar_files = FileComparisonModel.objects.filter(
            uploaded_file=file, similarity_result=max_similarity)

        other_file_info[file.filename] = [f.other_file for f in similar_files]

        # Adding the max_similarity to the dictionary with the file's name as the key
        # Default to 0.0 if no max_similarity found
        max_similarities[file.filename] = float(
            str(max_similarity*100)[:6]) if max_similarity is not None else 0.0

        user_aidetection_results = AIDetection.objects.filter(
            uploaded_by=file.uploaded_by)

        aidetection_results[file.filename] = user_aidetection_results

    serializer = FileSerializer(files, many=True)

    file_data = []
    for file in serializer.data:
        filename = file['filename']
        # Default to 0.0 if no max_similarity found
        max_similarity = max_similarities.get(filename, 0.0)
        uploader_info = file['uploaded_by']
        other_files = [FileSerializer(
            f).data for f in other_file_info.get(filename, None)]
        other_file_names = [f['filename'] for f in other_files]

        user_aidetection_results = aidetection_results.get(filename, None)

        file_data.append({
            **file,
            'max_similarity': max_similarity,
            'other_files_with_max_similarity': other_files,
            'other_file_names': other_file_names,
            'user_aidetection_results': AIDetectionSerializer(user_aidetection_results, many=True).data if user_aidetection_results else []
        })
        print(other_file_names)

    response_data = {
        'file_data': file_data,
    }

    return Response(response_data)


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
def ocr_Results(request, pk):
    ocr_result = OcrResult.objects.get(uploaded_by__user_id=pk)
    uploaded_by_user_id = ocr_result.uploaded_by.user_id

    serializer = OcrResultSerializer(ocr_result)
    print(uploaded_by_user_id)
    return Response(serializer.data)
