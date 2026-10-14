"""How likely a transcription is AI-written, using desklib/ai-text-detector-academic-v1.01.

Chosen in the detector bake-off (research/model_bakeoff.ipynb, free Colab) over the previous
DistilBERT classifier (API/new-model) and Oxidane/tmr-ai-text-detector. Test set: 45 human and
45 ChatGPT answers from HC3, plus the 20 answers in evaluation_data.py written by a current model,
each scored again with simulated OCR slips at a 10% word error rate. With the threshold set so
about 5% of human answers were flagged, it caught 93% of the ChatGPT answers in OCR-noised text
(DistilBERT: 11%).

It is trained on older chatbot output, so answers from the newest models are mostly missed.
"""
import threading

import torch
from torch import nn
from transformers import AutoConfig, AutoModel, AutoTokenizer, PreTrainedModel

MODEL_ID = "desklib/ai-text-detector-academic-v1.01"
MODEL_REVISION = "fe9b4da50ee2cca5c877d607640681609170e363"  # MIT licence; about 1.7 GB
MAX_TOKENS = 768  # longer answers are cut here

# Levels for the 0-1 probability, set on the bake-off's OCR-noised answers
# (research/ai_detector_thresholds.py). At HIGH: 1 of 45 human answers (2%), 42 of 45 ChatGPT
# answers (93%) and 2 of 20 current-model answers. At MEDIUM: 11% of human answers, every ChatGPT one.
# TODO(roadmap:real-eval-set): 45 human answers is a small set; re-calibrate on real handwritten answers.
HIGH_SCORE = 0.95
MEDIUM_SCORE = 0.80

# TODO(roadmap:newer-ai-detector): re-run the bake-off when a detector trained on newer models appears.


class DesklibAIDetectionModel(PreTrainedModel):
    """The class from the model card: mean-pooled DeBERTa-v3-large with a one-logit head."""
    config_class = AutoConfig

    def __init__(self, config):
        super().__init__(config)
        self.model = AutoModel.from_config(config)
        self.classifier = nn.Linear(config.hidden_size, 1)
        self.post_init()

    def forward(self, input_ids, attention_mask):
        hidden = self.model(input_ids, attention_mask=attention_mask)[0]
        mask = attention_mask.unsqueeze(-1).to(hidden.dtype)
        return self.classifier((hidden * mask).sum(1) / mask.sum(1).clamp(min=1e-9))


_lock = threading.Lock()
_loaded = None


def _load():
    """Load the tokenizer and model once per process (downloaded on first use)."""
    global _loaded
    with _lock:
        if _loaded is None:
            # TODO(roadmap:upgrade-ml-deps): the repo's tokenizer.json needs tokenizers >= 0.15, which
            # transformers 4.34 doesn't allow, so use its SentencePiece model (same vocabulary).
            tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, revision=MODEL_REVISION, use_fast=False)
            model, info = DesklibAIDetectionModel.from_pretrained(
                MODEL_ID, revision=MODEL_REVISION, output_loading_info=True)
            if info["missing_keys"]:
                # Otherwise the head would be left random and every score meaningless.
                raise RuntimeError(f"{MODEL_ID} loaded without weights for {info['missing_keys'][:3]}")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            _loaded = tokenizer, model.to(device).eval(), device
    return _loaded


def ai_probability(text):
    """0-1 probability that `text` is AI-written."""
    tokenizer, model, device = _load()
    encoded = tokenizer(text, return_tensors="pt", truncation=True, max_length=MAX_TOKENS).to(device)
    with torch.no_grad():
        logit = model(encoded["input_ids"], encoded["attention_mask"])
    return torch.sigmoid(logit)[0, 0].item()


def ai_level(probability, medium=MEDIUM_SCORE, high=HIGH_SCORE):
    """low / medium / high for a 0-1 AI probability."""
    if probability >= high:
        return "high"
    if probability >= medium:
        return "medium"
    return "low"
