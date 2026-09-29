from django.db import migrations


def link_existing_rows(apps, schema_editor):
    """Attach existing OCR results and text files to the PDF submission they came from.

    Before this, rows were only connected by uploader + filename: the pipeline names
    the OCR result after the PDF and the text file "<pdf name>.txt".
    """
    FileModel = apps.get_model("base", "FileModel")
    OcrResult = apps.get_model("base", "OcrResult")
    TxtFileModel = apps.get_model("base", "TxtFileModel")

    def find_submission(uploaded_by_id, filename):
        return FileModel.objects.filter(uploaded_by_id=uploaded_by_id, filename=filename).order_by("-id").first()

    for ocr in OcrResult.objects.filter(submission__isnull=True):
        submission = find_submission(ocr.uploaded_by_id, ocr.filename)
        if submission:
            ocr.submission = submission
            ocr.save(update_fields=["submission"])

    for txt in TxtFileModel.objects.filter(submission__isnull=True):
        name = txt.filename[:-4] if txt.filename.endswith(".txt") else txt.filename
        submission = find_submission(txt.uploaded_by_id, name)
        if submission:
            txt.submission = submission
            txt.save(update_fields=["submission"])


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0003_assignments_and_submission_links"),
    ]

    operations = [
        migrations.RunPython(link_existing_rows, migrations.RunPython.noop),
    ]
