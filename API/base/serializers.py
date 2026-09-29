from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from base.models import User
from .models import Assignment, FileModel, FileComparisonModel, AIDetection, OcrResult
from django.contrib.auth import authenticate

class UserRegisterSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'password',  'full_name']

    def create(self, clean_data):
        user = User.objects.create_user(
            clean_data['email'],
            clean_data['password'],
            full_name=clean_data['full_name'],
        )
        user.save()
        return user
    
class UserSerializer(ModelSerializer):
    # Nested in API responses, so list fields explicitly: never expose the
    # password hash or auth flags (is_staff, is_superuser, permissions, ...).
    class Meta:
        model = User
        fields = ['user_id', 'username', 'email', 'full_name']

class FileSerializer(ModelSerializer):
    uploaded_by = UserSerializer()
    class Meta:
        model = FileModel
        fields = '__all__'

class UserLoginSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'password']

    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, clean_data):
        user = authenticate(
            email=clean_data['Email'],
            password=clean_data['password']
        )
        if user is None:
            raise serializers.ValidationError("Invalid Credentials")
        return user

class FileComparisonSerializer(serializers.ModelSerializer):
    uploaded_file = FileSerializer()
    other_file = FileSerializer()

    class Meta:
        model = FileComparisonModel
        fields = ('uploaded_file', 'other_file', 'similarity_result')

class AIDetectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIDetection
        fields = ['id', 'uploaded_by', 'detection_results_Human', 'detection_results_AI']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['uploaded_by'] = instance.uploaded_by.email  # Assuming 'username' is a field in your User model
        return representation

class FileModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileModel
        fields = ['id', 'uploaded_by', 'assignment', 'filename', 'description', 'file']
        # Set from the logged-in user, never from the request body.
        read_only_fields = ['uploaded_by']

class AssignmentSerializer(serializers.ModelSerializer):
    submission_count = serializers.IntegerField(source='submissions.count', read_only=True)

    class Meta:
        model = Assignment
        fields = ['id', 'title', 'reference_text', 'created_on', 'submission_count']

class OcrResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = OcrResult
        fields = ['id', 'uploaded_by', 'ocr_results']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['uploaded_by'] = instance.uploaded_by.email if instance.uploaded_by else None
        return representation