from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from base.models import User
from .models import FileModel, FileComparisonModel, AIDetection, OcrResult
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
    class Meta:
        model = User
        fields = '__all__'

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
        fields = ['id', 'uploaded_by', 'filename', 'description', 'file']

class OcrResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = OcrResult
        fields = ['id', 'uploaded_by', 'ocr_results']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['uploaded_by'] = instance.uploaded_by.email  
        return representation