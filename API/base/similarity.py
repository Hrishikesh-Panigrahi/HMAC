"""Duplicate-content detection based on shared phrases.

Students answering the same question use the same vocabulary, so word-frequency
similarity mostly measures "same topic". Copying shows up differently: as runs
of identical wording. So we compare short phrases, and ignore phrases that come
from the assignment's question paper / model answer or that a large part of the
class uses (definitions everyone memorised, the question restated, ...).

Both the original and the copy are handwritten and read by OCR separately, and a
single misread word would break every phrase it sits in. So by default a phrase
still matches with one word different ("the chloroplast contain a green" ~
"the chloroplasts contain a green").

The constants below were tuned with manage.py evaluate_similarity.
"""
import math
import re
from collections import Counter
from itertools import combinations
from statistics import median

from django.db import transaction
from django.db.models import Q

# Tuned with manage.py evaluate_similarity: 20 independent answers to 4 questions,
# copies made from them, and simulated OCR slips at the 10-20% word error rate
# measured on real transcriptions. Exact 5-word phrases lost most copies to OCR
# noise (a whole copied answer scored ~35%); 4-word phrases that may differ in one
# word kept honest answers low and caught copies.
PHRASE_LENGTH = 4
# Let a phrase match with one word different (OCR slips, a word changed while copying).
FUZZY_MATCH = True

# A phrase used by at least this share of the class counts as common wording and
# is ignored. Too low and a group copying from each other hides itself; too high
# and textbook phrasing gets flagged. (Small test classes can't tune this one.)
COMMON_PHRASE_SHARE = 0.3
# ...but always needs this many students. Three students using the same wording is
# already more likely a memorised source than copying (it roughly halved overlap
# from quoted definitions compared with 6).
MIN_COMMON_PHRASE_DOCS = 3

# Levels for a submission's closest match (scores are 0-1 shares of its phrases).
# On the evaluation set: no honest answer reached HIGH, 2% reached MEDIUM (only two
# students quoting the same textbook law with no model answer pasted); 98-100% of
# whole-answer copies and 78-100% of reworded copies reached HIGH.
HIGH_SCORE = 0.35
HIGH_SCORE_VS_CLASS = 0.25  # ...or this much when it's also well above the class median
HIGH_MEDIAN_MULTIPLE = 3
MEDIUM_SCORE = 0.20

WORD_RE = re.compile(r"[A-Za-z0-9]+(?:'[A-Za-z]+)?")

# Phrases made (almost) only of these carry no signal ("it is one of the").
STOPWORDS = frozenset(
    "a an the and or but if of at by for with about to from in on into over under is are was were be been "
    "being am do does did has have had it its this that these those there here they them their he she his "
    "her we our you your i me my as so than then too very can will would should could may might must not no "
    "which who whom what when where why how all any each some such only own same just also".split()
)


def tokenize(text):
    """Lower-cased words with their (start, end) character offsets in the original text."""
    return [(m.group().lower(), m.start(), m.end()) for m in WORD_RE.finditer(text or "")]


def phrase_windows(tokens, n=PHRASE_LENGTH):
    """(start position, n-word phrase) for every phrase worth comparing."""
    words = [word for word, _, _ in tokens]
    windows = []
    for i in range(len(words) - n + 1):
        gram = tuple(words[i:i + n])
        if sum(word in STOPWORDS for word in gram) >= n - 1:
            continue
        windows.append((i, gram))
    return windows


def variants(gram, fuzzy=FUZZY_MATCH):
    """Keys a phrase matches on: itself, or with fuzzy matching each version with one word blanked."""
    if not fuzzy:
        return (gram,)
    return tuple(gram[:k] + (None,) + gram[k + 1:] for k in range(len(gram)))


class Document:
    def __init__(self, key, text, n=PHRASE_LENGTH, fuzzy=FUZZY_MATCH):
        self.key = key
        self.text = text or ""
        self.n = n
        self.tokens = tokenize(self.text)
        self.windows = [(start, variants(gram, fuzzy)) for start, gram in phrase_windows(self.tokens, n)]
        self.keys = {key for _, keys in self.windows for key in keys}


def ignored_phrases(docs, reference_text="", n=PHRASE_LENGTH, fuzzy=FUZZY_MATCH,
                    min_docs=MIN_COMMON_PHRASE_DOCS, share=COMMON_PHRASE_SHARE):
    """Phrases from the question paper / model answer, plus ones most of the class shares."""
    ignored = set(Document(None, reference_text, n, fuzzy).keys)
    threshold = max(min_docs, math.ceil(share * len(docs)))
    counts = Counter(key for doc in docs for key in doc.keys)
    ignored.update(key for key, count in counts.items() if count >= threshold)
    return frozenset(ignored)


def _matches(doc, other, ignored):
    """How many of doc's phrases count, and where the ones also found in `other` start."""
    counted, starts = 0, []
    for start, keys in doc.windows:
        # Within one word of the question paper or common wording: leave it out entirely.
        if any(key in ignored for key in keys):
            continue
        counted += 1
        if any(key in other.keys for key in keys):
            starts.append(start)
    return counted, starts


def _spans(doc, starts):
    """Character spans covered by the matched phrases, merged into passages."""
    covered = set()
    for start in starts:
        covered.update(range(start, start + doc.n))
    spans = []
    for i in sorted(covered):
        _, start, end = doc.tokens[i]
        if spans and i - 1 in covered:
            spans[-1][1] = end
        else:
            spans.append([start, end])
    return spans


def compare(a, b, ignored=frozenset()):
    """Return (share of a's phrases found in b, share of b's found in a, a's spans, b's spans)."""
    counted_a, starts_a = _matches(a, b, ignored)
    counted_b, starts_b = _matches(b, a, ignored)
    score_a = len(starts_a) / counted_a if counted_a else 0.0
    score_b = len(starts_b) / counted_b if counted_b else 0.0
    return score_a, score_b, _spans(a, starts_a), _spans(b, starts_b)


def similarity_level(score, class_median, medium=MEDIUM_SCORE, high=HIGH_SCORE,
                     high_vs_class=HIGH_SCORE_VS_CLASS, median_multiple=HIGH_MEDIAN_MULTIPLE):
    """low / medium / high for a submission's closest-match score (both 0-1)."""
    if score >= high or (score >= high_vs_class and score >= median_multiple * class_median):
        return "high"
    if score >= medium:
        return "medium"
    return "low"


def class_median(scores):
    return median(scores) if scores else 0.0


# ---------------------------------------------------------------------------
# Database side
# ---------------------------------------------------------------------------

def submission_text(txt_file):
    """The text a processed submission is compared on: its latest OCR transcription."""
    from .models import OcrResult

    if txt_file.submission_id:
        ocr = OcrResult.objects.filter(submission_id=txt_file.submission_id).order_by("-id").first()
        if ocr:
            return ocr.ocr_results
    # Legacy rows without a linked submission only have the stop-word-filtered text file.
    return " ".join(txt_file.read_file_content())


def recompute_assignment(assignment_id):
    """Rebuild every comparison between submissions of one assignment.

    `None` is the group of submissions without an assignment. Everything is
    recomputed because which phrases count as "common" depends on the whole class.
    """
    from .models import Assignment, FileComparisonModel, TxtFileModel

    rows = list(TxtFileModel.objects.filter(submission__assignment_id=assignment_id))
    assignment = Assignment.objects.filter(pk=assignment_id).first() if assignment_id else None
    docs = [Document(row.pk, submission_text(row)) for row in rows]
    ignored = ignored_phrases(docs, assignment.reference_text if assignment else "")

    comparisons = []
    for i, j in combinations(range(len(rows)), 2):
        score_i, score_j, spans_i, spans_j = compare(docs[i], docs[j], ignored)
        comparisons.append(FileComparisonModel(
            uploaded_file=rows[i], other_file=rows[j], similarity_result=score_i,
            matches={"self": spans_i, "other": spans_j}))
        comparisons.append(FileComparisonModel(
            uploaded_file=rows[j], other_file=rows[i], similarity_result=score_j,
            matches={"self": spans_j, "other": spans_i}))

    with transaction.atomic():
        FileComparisonModel.objects.filter(Q(uploaded_file__in=rows) | Q(other_file__in=rows)).delete()
        FileComparisonModel.objects.bulk_create(comparisons)
    return len(comparisons)


def recompute_all():
    from .models import TxtFileModel

    groups = set(TxtFileModel.objects.values_list("submission__assignment_id", flat=True))
    return {group: recompute_assignment(group) for group in groups}
