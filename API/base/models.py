from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager

class CustomUserManager(BaseUserManager):
    def create_user(self, user_id, email, password, is_active=True, is_staff=False, is_superuser=False, full_name=None):

        if not email:
            raise ValueError('Invalid Email')

        if not password:
            raise ValueError('Password cannot be empty')

        User = self.model(
            email=self.normalize_email(email)
        )
        User.user_id = user_id
        User.is_active = is_active
        User.is_staff = is_staff
        User.is_superuser = is_superuser

        User.set_password(password)

        User.full_name = full_name

        User.save(using=self.db)
        return User

    def create_staffuser(self, user_id, email, password):
        User = self.create_user(
            user_id,
            email=email,
            password=password,
            is_staff=True,
            is_superuser=False
        )
        return User

    def create_superuser(self, user_id, email, password):
        User = self.create_user(
            user_id,
            email=email,
            password=password,
            is_staff=True,
            is_superuser=True
        )
        return User

class User(AbstractUser):
    user_id = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=255, unique=True)

    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)

    full_name = models.CharField(max_length=50, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['user_id',]

    objects = CustomUserManager()

    def __str__(self):
        return str(self.email)

class Assignment(models.Model):
    title = models.CharField(max_length=255)
    # Question paper or model answer. Phrases that appear here are ignored by duplicate detection.
    reference_text = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="assignments")
    created_on = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class FileModel(models.Model):
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    # Submissions are only compared with others handed in for the same assignment.
    assignment = models.ForeignKey(Assignment, on_delete=models.SET_NULL, null=True, blank=True, related_name="submissions")
    filename = models.CharField(max_length=255)
    description = models.TextField()
    file = models.FileField(upload_to='files/')

    def __str__(self):
        return self.filename
    
class FileImage(models.Model):
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    pdfFile = models.ForeignKey(FileModel, on_delete=models.CASCADE)
    filename = models.CharField(max_length=255)
    description = models.TextField()
    file = models.FileField(upload_to='fileImages/')

    def __str__(self):
        return self.filename

class AIDetection(models.Model):
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    image = models.ForeignKey(FileImage, on_delete=models.CASCADE)
    filename = models.CharField(max_length=255)
    detection_results_Human = models.FloatField(null=True)
    detection_results_AI = models.FloatField(null=True)

    def __str__(self):
        return f"Result of {self.uploaded_by} is {self.detection_results_Human}"

class TxtFileModel(models.Model):
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    submission = models.ForeignKey(FileModel, on_delete=models.CASCADE, null=True, blank=True, related_name="txt_files")
    filename = models.CharField(max_length=255)
    description = models.TextField()
    file = models.FileField(upload_to='txtfiles/')

    @staticmethod
    def preprocess_ocr_data(ocr_data):
        # This removes the commas from the txt files to not cause bloated percentage
        return [word.strip() for word in ocr_data.split(',') if word.strip()]

    def read_file_content(self):
        # Implement this method to read and return the content of the file
        try:
            with open(self.file.path, 'r') as file:
                content = file.read()
                preprocessed_content = TxtFileModel.preprocess_ocr_data(content)
                return preprocessed_content
        except Exception as exc:
            print(f"Error reading file '{self.filename}': {exc}")
            return ""

    def __str__(self):
        return self.filename

class FileComparisonModel(models.Model):
    # One row per direction: similarity_result is the share of uploaded_file's
    # phrases that also appear in other_file.
    uploaded_file = models.ForeignKey(
        TxtFileModel, on_delete=models.CASCADE, related_name='uploaded_file')
    other_file = models.ForeignKey(
        TxtFileModel, on_delete=models.CASCADE, related_name='other_file')
    similarity_result = models.FloatField()
    # Matched passages as character spans into each file's OCR text:
    # {"self": [[start, end], ...], "other": [[start, end], ...]}
    matches = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Comparison between {self.uploaded_file.filename} and {self.other_file.filename}"

class OcrResult(models.Model):
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    submission = models.ForeignKey(FileModel, on_delete=models.CASCADE, null=True, blank=True, related_name="ocr_results")
    filename = models.CharField(max_length=255)
    ocr_results = models.TextField()

    def __str__(self):
        return f"OCR Result of {self.uploaded_by} is {self.ocr_results}"