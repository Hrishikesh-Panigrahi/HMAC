from contextlib import contextmanager

from django.core.management.base import BaseCommand
from django.db.models.signals import post_save

from base import demo_data, signals
from base.ai_detection import ai_probability
from base.models import AIDetection, Assignment, FileImage, FileModel, OcrResult, TxtFileModel, User
from base.similarity import recompute_assignment

DEMO_EMAIL_DOMAIN = "demo.hmac.test"

PIPELINE_RECEIVERS = [
    (signals.convert_pdf_to_image, FileModel),
    (signals.create_ai_detection, FileImage),
    (signals.calculate_similarity_on_upload, TxtFileModel),
]


@contextmanager
def pipeline_muted():
    """The demo inserts OCR text directly, so skip PDF conversion, OCR and per-row rescoring."""
    for receiver, sender in PIPELINE_RECEIVERS:
        post_save.disconnect(receiver, sender=sender)
    try:
        yield
    finally:
        for receiver, sender in PIPELINE_RECEIVERS:
            post_save.connect(receiver, sender=sender)


class Command(BaseCommand):
    help = "Add (or with --delete, remove) a demo assignment with six sample answers to one question."

    def add_arguments(self, parser):
        parser.add_argument("--delete", action="store_true", help="Remove the demo assignment and its demo students.")

    def handle(self, *args, **options):
        deleted_users, _ = User.objects.filter(email__endswith=f"@{DEMO_EMAIL_DOMAIN}").delete()
        Assignment.objects.filter(title=demo_data.TITLE).delete()
        if options["delete"]:
            self.stdout.write(self.style.SUCCESS("Removed the demo assignment and its demo students."))
            return

        assignment = Assignment.objects.create(title=demo_data.TITLE, reference_text=demo_data.REFERENCE_TEXT)
        with pipeline_muted():
            for name, text in demo_data.ANSWERS.values():
                first = name.split()[0].lower()
                user = User.objects.create(user_id=f"demo-{first}", username=f"demo_{first}", full_name=name,
                                           email=f"{first}@{DEMO_EMAIL_DOMAIN}", is_active=False)
                user.set_unusable_password()
                user.save()

                filename = f"{name.split()[0]}_Photosynthesis"
                submission = FileModel.objects.create(uploaded_by=user, assignment=assignment, filename=filename,
                                                      description="Q1 photosynthesis", file=f"files/{filename}.pdf")
                image = FileImage.objects.create(uploaded_by=user, pdfFile=submission, filename=filename,
                                                 description=submission.description, file=f"fileImages/{filename}.jpg")

                ai = ai_probability(text) * 100
                AIDetection.objects.create(uploaded_by=user, image=image, filename=filename,
                                           detection_results_Human=100 - ai, detection_results_AI=ai)
                OcrResult.objects.create(uploaded_by=user, submission=submission, filename=filename, ocr_results=text)
                TxtFileModel.objects.create(uploaded_by=user, submission=submission, filename=f"{filename}.txt",
                                            description=submission.description, file=f"txtfiles/{filename}.txt")

        rows = recompute_assignment(assignment.pk)
        self.stdout.write(self.style.SUCCESS(
            f"Created '{assignment.title}' with {len(demo_data.ANSWERS)} submissions ({rows} comparison rows). "
            "Remove it with: manage.py seed_demo_assignment --delete"))
