from django.contrib import admin
from base.models import User
from base.models import FileModel

from base.models import FileComparisonModel
from base.models import AIDetection
from base.models import FileImage
from base.models import TxtFileModel
from base.models import OcrResult
from base.models import Assignment

# TODO(roadmap:user-admin): use a UserAdmin; a plain registration saves passwords typed here
# unhashed, so those accounts can't log in. Use `manage.py add_user` until then.
admin.site.register(User)
admin.site.register(FileModel)
admin.site.register(FileComparisonModel)
admin.site.register(AIDetection)
admin.site.register(FileImage)
admin.site.register(TxtFileModel)
admin.site.register(OcrResult)
admin.site.register(Assignment)
