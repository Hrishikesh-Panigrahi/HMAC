"""Score the bake-off's OCR-noised answers with HMAC's AI detector and show rates per threshold.

Same data and OCR noise as part 2 of model_bakeoff.ipynb: 45 human and 45 ChatGPT answers from
HC3, plus the 20 answers in API/base/evaluation_data.py written by a current model. Runs on CPU in
about 10 minutes. The thresholds in API/base/ai_detection.py come from this table.

    API/env/Scripts/python research/ai_detector_thresholds.py [scores.json]
"""
import json
import os
import random
import re
import sys
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "API"))
from base.ai_detection import HIGH_SCORE, MEDIUM_SCORE, ai_probability  # noqa: E402
from base.evaluation_data import QUESTIONS  # noqa: E402

LETTERS = "abcdefghijklmnopqrstuvwxyz"
THRESHOLDS = (0.5, 0.7, 0.75, MEDIUM_SCORE, 0.85, 0.9, 0.93, 0.94, HIGH_SCORE, 0.97)


def detokenize(text):
    """Undo HC3's tokeniser spacing so the detector can't key on it."""
    text = re.sub(r"\s+(n't|'s|'re|'ve|'ll|'d|'m)\b", r"\1", text)
    text = re.sub(r"\s+([.,!?;:%)\]])", r"\1", text)
    text = re.sub(r"([(\[])\s+", r"\1", text)
    text = re.sub(r'"\s+(.*?)\s+"', r'"\1"', text)
    return re.sub(r"\s{2,}", " ", text).strip()


def hc3(config, count):
    human, ai, offset = [], [], 0
    while (len(human) < count or len(ai) < count) and offset < 1000:
        url = (f"https://datasets-server.huggingface.co/rows?dataset=Hello-SimpleAI/HC3&config={config}"
               f"&split=train&offset={offset}&length=100")
        for r in json.load(urllib.request.urlopen(url, timeout=60))["rows"]:
            for text in map(detokenize, r["row"]["human_answers"][:1]):
                if 60 <= len(text.split()) <= 300 and len(human) < count:
                    human.append(text)
            for text in map(detokenize, r["row"]["chatgpt_answers"][:1]):
                if 60 <= len(text.split()) <= 300 and len(ai) < count:
                    ai.append(text)
        offset += 100
    return human, ai


def ocr_noise(text, wer, rng):
    """The notebook's OCR model: mostly misread letters, some dropped or extra words."""
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
            out.extend([word, rng.choice(["a", "the", "it", "of"])])
    return " ".join(out)


def main():
    human_eli5, ai_eli5 = hc3("reddit_eli5", 30)
    human_qa, ai_qa = hc3("open_qa", 15)
    sets = {
        "human": human_eli5 + human_qa,
        "ChatGPT": ai_eli5 + ai_qa,
        "current model": [a for q in QUESTIONS.values() for a in q["answers"]],
    }
    rng = random.Random(0)
    noisy = {k: [ocr_noise(t, 0.10, rng) for t in v] for k, v in sets.items()}
    scores = {k: [ai_probability(t) for t in texts] for k, texts in noisy.items()}
    if len(sys.argv) > 1:
        json.dump({"texts": noisy, "scores": scores}, open(sys.argv[1], "w"))

    for threshold in THRESHOLDS:
        rates = "  ".join(f"{k} {100 * sum(s >= threshold for s in v) / len(v):5.1f}%" for k, v in scores.items())
        print(f">= {threshold:.2f}: {rates}")


if __name__ == "__main__":
    main()
