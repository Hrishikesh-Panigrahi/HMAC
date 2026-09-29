from itertools import permutations

from django.db.models.signals import post_save
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from . import demo_data, signals
from .evaluation import TYPICAL_WER, detection_rates, evaluate
from .models import Assignment, FileComparisonModel, FileModel, OcrResult, TxtFileModel, User
from .similarity import (
    MEDIUM_SCORE, MIN_COMMON_PHRASE_DOCS, Document, compare, ignored_phrases, similarity_level,
)


def setUpModule():
    # Creating a FileModel normally kicks off PDF conversion + OCR; tests insert OCR text directly.
    post_save.disconnect(signals.convert_pdf_to_image, sender=FileModel)


def tearDownModule():
    post_save.connect(signals.convert_pdf_to_image, sender=FileModel)


def demo_docs():
    return {key: Document(key, text) for key, (_, text) in demo_data.ANSWERS.items()}


class PhraseSimilarityTests(SimpleTestCase):
    def setUp(self):
        self.docs = demo_docs()
        self.ignored = ignored_phrases(list(self.docs.values()), demo_data.REFERENCE_TEXT)

    def score(self, a, b):
        return compare(self.docs[a], self.docs[b], self.ignored)[0]

    def test_independent_answers_to_the_same_question_score_low(self):
        for a, b in permutations(self.docs, 2):
            if (a, b) in demo_data.COPIED_PAIRS or (b, a) in demo_data.COPIED_PAIRS:
                continue
            with self.subTest(pair=(a, b)):
                self.assertLess(self.score(a, b), MEDIUM_SCORE)

    def test_near_copy_with_ocr_slips_scores_high(self):
        self.assertGreater(self.score("copied_from_aarav", "aarav"), 0.8)
        self.assertEqual(similarity_level(self.score("copied_from_aarav", "aarav"), 0.0), "high")

    def test_partial_copy_is_flagged(self):
        score = self.score("partly_from_meera", "meera")
        self.assertGreater(score, 0.25)
        self.assertLess(score, 0.6)
        self.assertEqual(similarity_level(score, 0.0), "high")

    def test_restating_the_question_does_not_count(self):
        question = Document("question", "Explain the process of photosynthesis and describe the role of chlorophyll.")
        self.assertEqual(compare(self.docs["sana"], question, self.ignored)[0], 0.0)
        # Without the reference text the same overlap would count.
        self.assertGreater(compare(self.docs["sana"], question)[0], 0.0)

    def test_phrasing_most_of_the_class_uses_is_ignored(self):
        shared = "The mitochondria is the powerhouse of the cell and it makes energy. "
        docs = [Document(i, shared + f"Student {i} wrote a completely different second part number {i}.")
                for i in range(MIN_COMMON_PHRASE_DOCS + 2)]
        ignored = ignored_phrases(docs)
        self.assertEqual(compare(docs[0], docs[1], ignored)[0], 0.0)

    def test_spans_mark_the_copied_passage(self):
        doc = self.docs["copied_from_aarav"]
        _, _, spans, _ = compare(doc, self.docs["aarav"], self.ignored)
        marked = " ".join(doc.text[start:end] for start, end in spans)
        self.assertIn("The oxygen escapes into the air through tiny pores called stomata", marked)
        # One word different ("in to" for "into") doesn't break the copied passage.
        self.assertIn("splits water in to hydrogen", marked)

    def test_class_median_raises_the_bar(self):
        self.assertEqual(similarity_level(0.25, class_median=0.02), "high")
        self.assertEqual(similarity_level(0.25, class_median=0.20), "medium")
        self.assertEqual(similarity_level(0.05, class_median=0.0), "low")


class TunedThresholdTests(SimpleTestCase):
    """Guards the tuning in similarity.py; rerun manage.py evaluate_similarity after changing it."""

    def test_honest_answers_are_not_flagged_and_copies_are(self):
        rates = detection_rates(evaluate(wer=TYPICAL_WER, seeds=1))
        honest_medium, honest_high = rates["independent"]
        self.assertEqual(honest_high, 0)
        self.assertLessEqual(honest_medium, 0.05)
        self.assertGreaterEqual(rates["full"][1], 0.95)
        self.assertGreaterEqual(rates["reworded"][0], 0.9)


class SubmissionsMixin:
    def make_user(self, key, name, staff=False):
        user = User.objects.create(user_id=key, username=key, email=f"{key}@hmac.test", full_name=name,
                                   is_active=True, is_staff=staff)
        user.set_password("unused")
        user.save()
        return user

    def make_submission(self, user, text, assignment=None, name=None):
        name = name or f"{user.username}_answer"
        submission = FileModel.objects.create(uploaded_by=user, assignment=assignment, filename=name,
                                              description="answer", file=f"files/{name}.pdf")
        OcrResult.objects.create(uploaded_by=user, submission=submission, filename=name, ocr_results=text)
        # Saving the text file triggers the similarity recompute, like the real pipeline.
        return TxtFileModel.objects.create(uploaded_by=user, submission=submission, filename=f"{name}.txt",
                                           description="answer", file=f"txtfiles/{name}.txt")

    def seed_demo(self):
        self.assignment = Assignment.objects.create(title=demo_data.TITLE, reference_text=demo_data.REFERENCE_TEXT)
        self.rows = {}
        for key, (name, text) in demo_data.ANSWERS.items():
            self.rows[key] = self.make_submission(self.make_user(key, name), text, self.assignment)


class RecomputeTests(SubmissionsMixin, TestCase):
    def test_comparisons_are_stored_in_both_directions(self):
        self.seed_demo()
        pairs = len(self.rows) * (len(self.rows) - 1) // 2
        self.assertEqual(FileComparisonModel.objects.count(), 2 * pairs)
        a, b = self.rows["aarav"], self.rows["copied_from_aarav"]
        self.assertTrue(FileComparisonModel.objects.filter(uploaded_file=a, other_file=b, similarity_result__gt=0.6).exists())
        self.assertTrue(FileComparisonModel.objects.filter(uploaded_file=b, other_file=a, similarity_result__gt=0.6).exists())

    def test_submissions_are_only_compared_within_their_assignment(self):
        self.seed_demo()
        other = Assignment.objects.create(title="Another assignment")
        copy = self.make_submission(self.make_user("outsider", "Outsider"), demo_data.ANSWERS["aarav"][1], other)
        self.assertFalse(FileComparisonModel.objects.filter(uploaded_file=copy).exists())
        self.assertFalse(FileComparisonModel.objects.filter(other_file=copy).exists())


class ApiTests(SubmissionsMixin, TestCase):
    def setUp(self):
        self.seed_demo()
        self.professor = self.make_user("prof", "Prof", staff=True)
        self.student = User.objects.get(username="aarav")

    def client_for(self, user=None):
        client = APIClient()
        if user:
            client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}")
        return client

    def test_teacher_files_requires_a_professor(self):
        self.assertEqual(self.client_for().get("/api/v1/teacher/files/").status_code, 401)
        self.assertEqual(self.client_for(self.student).get("/api/v1/teacher/files/").status_code, 403)
        self.assertEqual(self.client_for(self.professor).get("/api/v1/teacher/files/").status_code, 200)

    def test_teacher_files_reports_closest_match_and_level(self):
        response = self.client_for(self.professor).get(f"/api/v1/teacher/files/?assignment={self.assignment.pk}")
        rows = {row["uploaded_by"]["username"]: row for row in response.json()["file_data"]}
        self.assertEqual(len(rows), len(demo_data.ANSWERS))
        self.assertNotIn("password", response.content.decode())

        copied = rows["copied_from_aarav"]
        self.assertEqual(copied["closest"]["uploaded_by"]["username"], "aarav")
        self.assertEqual(copied["similarity_level"], "high")
        # The original author is flagged too; before, the first upload always showed 0%.
        self.assertEqual(rows["aarav"]["closest"]["uploaded_by"]["username"], "copied_from_aarav")
        self.assertEqual(rows["rohan"]["similarity_level"], "low")
        self.assertLess(rows["rohan"]["max_similarity"], MEDIUM_SCORE * 100)

    def test_similarity_detail_returns_highlightable_spans(self):
        row = self.rows["partly_from_meera"]
        data = self.client_for(self.professor).get(f"/api/v1/submissions/{row.pk}/similarity/").json()
        top = data["matches"][0]
        self.assertEqual(top["uploaded_by"]["username"], "meera")
        own = [data["text"][s:e] for s, e in top["spans"]]
        theirs = [top["other_text"][s:e] for s, e in top["other_spans"]]
        self.assertIn("Plants are autotrophs, which means they prepare their food themselves", own[0])
        self.assertIn("Plants are autotrophs, which means they prepare their food themselves", theirs[0])

    def test_students_see_assignment_titles_only(self):
        data = self.client_for(self.student).get("/api/v1/assignments/").json()
        self.assertEqual(data, [{"id": self.assignment.pk, "title": demo_data.TITLE}])
        self.assertEqual(self.client_for(self.student).post("/api/v1/assignments/", {"title": "x"}).status_code, 403)

    def test_professor_creates_assignment(self):
        response = self.client_for(self.professor).post("/api/v1/assignments/", {"title": "Essay 2", "reference_text": "Q2."})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Assignment.objects.get(pk=response.json()["id"]).created_by, self.professor)

    def test_editing_reference_text_rescores_the_assignment(self):
        # Make Aarav's whole answer the "model answer": the copy no longer counts.
        self.client_for(self.professor).patch(f"/api/v1/assignments/{self.assignment.pk}/",
                                              {"reference_text": demo_data.ANSWERS["aarav"][1]}, format="json")
        copied = FileComparisonModel.objects.get(uploaded_file=self.rows["copied_from_aarav"], other_file=self.rows["aarav"])
        self.assertLess(copied.similarity_result, MEDIUM_SCORE)

    def test_ocr_result_is_looked_up_by_submission(self):
        row = self.rows["meera"]
        data = self.client_for(self.professor).get(f"/api/v1/results/{row.pk}").json()
        self.assertEqual(data["ocr_results"], demo_data.ANSWERS["meera"][1])
        self.assertEqual(self.client_for(self.professor).get("/api/v1/results/999999").status_code, 404)

    def test_upload_requires_login(self):
        self.assertEqual(self.client_for().post("/api/v1/Upload/", {}).status_code, 401)
