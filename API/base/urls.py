from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('Upload/', views.upload_file, name='Upload'),
    path('assignments/', views.assignments, name='assignments'),
    path('assignments/<int:pk>/', views.assignment_detail, name='assignment_detail'),
    path('teacher/files/', views.list_files_for_teacher, name='list_files_for_teacher'),
    path('submissions/<int:pk>/similarity/', views.similarity_detail, name='similarity_detail'),
    path('results/<int:pk>', views.ocr_Results, name='results'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
