from django.core.management.base import BaseCommand

from base.ai_detection import MODEL_ID, ai_probability
from base.models import AIDetection, OcrResult


class Command(BaseCommand):
    help = f"Re-score every AI-detection result with the current detector ({MODEL_ID})."

    def handle(self, *args, **options):
        rescored = skipped = 0
        for detection in AIDetection.objects.select_related("image"):
            # Scored on the stored raw OCR text, like a new upload.
            ocr = OcrResult.objects.filter(submission_id=detection.image.pdfFile_id).order_by("-id").first()
            if not ocr or not ocr.ocr_results:
                skipped += 1
                continue
            ai = ai_probability(ocr.ocr_results) * 100
            detection.detection_results_AI, detection.detection_results_Human = ai, 100 - ai
            detection.save(update_fields=["detection_results_AI", "detection_results_Human"])
            rescored += 1
        note = f" Skipped {skipped} without a transcription." if skipped else ""
        self.stdout.write(self.style.SUCCESS(f"Re-scored {rescored} results.{note}"))
