"""Measure how well duplicate detection separates copied answers from honest ones.

Every answer in evaluation_data.QUESTIONS was written independently. Copies are
made from them (whole answer, half, a quarter, or reworded), then every text gets
simulated OCR slips, because in HMAC both the original and the copy are
handwritten and read by OCR separately. A submission's score is its closest match
in the class, which is what the Summary shows.
"""
import random
import re
from dataclasses import dataclass
from statistics import median

from .evaluation_data import QUESTIONS
from .similarity import (
    COMMON_PHRASE_SHARE, FUZZY_MATCH, MIN_COMMON_PHRASE_DOCS, PHRASE_LENGTH,
    Document, compare, ignored_phrases, similarity_level,
)

SENTENCE_RE = re.compile(r"(?<=[.!?])\s+")
LETTERS = "abcdefghijklmnopqrstuvwxyz"
FILLERS = ["a", "the", "it", "of", "on", "is"]

# TrOCR word error rates measured on the stored transcriptions were 1-10% for full
# answers (23% on one short, partial one), so 10% is typical and 20% is bad handwriting.
TYPICAL_WER = 0.10
BAD_WER = 0.20

COPY_KINDS = ("full", "half", "quarter", "reworded")


def ocr_noise(text, wer, rng):
    """Mostly misread letters ('casting' -> 'casing'), sometimes a dropped or extra word."""
    out = []
    for word in text.split():
        if rng.random() >= wer:
            out.append(word)
            continue
        kind = rng.random()
        if kind < 0.8 and len(word) > 1:
            chars = list(word)
            i = rng.randrange(len(chars))
            if chars[i].isalpha():
                chars[i] = rng.choice(LETTERS)
            out.append("".join(chars))
        elif kind < 0.95:
            continue
        else:
            out.extend([word, rng.choice(FILLERS)])
    return " ".join(out)


def sentences(text):
    return SENTENCE_RE.split(text.strip())


def make_copy(kind, source, own, rng):
    """What a copier hands in: some or all of `source`, the rest from their own answer."""
    if kind == "full":
        return source
    if kind in ("half", "quarter"):
        src, mine = sentences(source), sentences(own)
        take = max(1, round(len(src) * (0.5 if kind == "half" else 0.25)))
        return " ".join(src[:take] + mine[take:])
    if kind == "reworded":
        # Swap about one word in five for one of their own, like a quick paraphrase.
        own_words = own.split()
        return " ".join(rng.choice(own_words) if rng.random() < 0.2 else w for w in source.split())
    raise ValueError(kind)


def reference_for(question, mode):
    if mode == "none":
        return ""
    if mode == "question":
        return question["reference"]
    return f'{question["reference"]} {question.get("textbook", "")}'


@dataclass
class Result:
    kind: str       # "independent" or a copy kind
    question: str
    score: float    # the submission's closest-match score (0-1)
    class_median: float  # median closest-match score in that class


def closest_scores(texts, reference, n, min_docs, share, fuzzy):
    docs = [Document(i, t, n, fuzzy) for i, t in enumerate(texts)]
    ignored = ignored_phrases(docs, reference, n=n, fuzzy=fuzzy, min_docs=min_docs, share=share)
    best = [0.0] * len(docs)
    for i in range(len(docs)):
        for j in range(i + 1, len(docs)):
            a, b, _, _ = compare(docs[i], docs[j], ignored)
            best[i], best[j] = max(best[i], a), max(best[j], b)
    return best


def evaluate(n=PHRASE_LENGTH, min_docs=MIN_COMMON_PHRASE_DOCS, share=COMMON_PHRASE_SHARE, fuzzy=FUZZY_MATCH,
             mode="question", wer=TYPICAL_WER, seeds=3):
    results = []
    for seed in range(seeds):
        rng = random.Random(seed)
        for name, question in QUESTIONS.items():
            answers = question["answers"]
            reference = reference_for(question, mode)

            # Honest class: everyone wrote their own answer.
            noisy = [ocr_noise(a, wer, rng) for a in answers]
            scores = closest_scores(noisy, reference, n, min_docs, share, fuzzy)
            results.extend(Result("independent", name, score, median(scores)) for score in scores)

            # One copier per scenario: student j hands in a copy of student i's answer.
            for kind in COPY_KINDS:
                for i, source in enumerate(answers):
                    for j, own in enumerate(answers):
                        if i == j:
                            continue
                        texts = list(answers)
                        texts[j] = make_copy(kind, source, own, rng)
                        noisy = [ocr_noise(t, wer, rng) for t in texts]
                        scores = closest_scores(noisy, reference, n, min_docs, share, fuzzy)
                        results.append(Result(kind, name, scores[j], median(scores)))
    return results


def percentile(values, q):
    values = sorted(values)
    if not values:
        return 0.0
    k = (len(values) - 1) * q
    lo, hi = int(k), min(int(k) + 1, len(values) - 1)
    return values[lo] + (values[hi] - values[lo]) * (k - lo)


def summarize(results):
    by_kind = {}
    for r in results:
        by_kind.setdefault(r.kind, []).append(r.score)
    return {kind: {
        "count": len(scores),
        "min": min(scores),
        "p10": percentile(scores, 0.10),
        "median": percentile(scores, 0.5),
        "p95": percentile(scores, 0.95),
        "max": max(scores),
    } for kind, scores in by_kind.items()}


def separation(summary):
    """How far the weakest real copies sit above the strongest honest answers (higher is better)."""
    honest = summary["independent"]["p95"]
    return min(summary[k]["p10"] for k in ("full", "half", "reworded")) - honest


def detection_rates(results, **thresholds):
    """Share of submissions of each kind that land in medium-or-above and in high."""
    rates = {}
    for kind in ("independent",) + COPY_KINDS:
        levels = [similarity_level(r.score, r.class_median, **thresholds) for r in results if r.kind == kind]
        rates[kind] = (sum(l != "low" for l in levels) / len(levels), levels.count("high") / len(levels))
    return rates
