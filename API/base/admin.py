from django.contrib import admin
from base.models import User
from base.models import FileModel

from base.models import FileComparisonModel
from base.models import AIDetection
from base.models import FileImage
from base.models import TxtFileModel
from base.models import OcrResult
from base.models import Assignment

admin.site.register(User)
admin.site.register(FileModel)
admin.site.register(FileComparisonModel)
admin.site.register(AIDetection)
admin.site.register(FileImage)
admin.site.register(TxtFileModel)
admin.site.register(OcrResult)
admin.site.register(Assignment)
