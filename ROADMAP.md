# Roadmap

What's next for HMAC, in the order we plan to do it. Each item has a tag, and the code it touches carries a matching comment, so you can jump between the two:

```bash
git grep -n "roadmap:background-jobs"
```

## Iteration 1: make the pipeline dependable

| Tag | What | Where |
|---|---|---|
| `background-jobs` | OCR, AI detection and similarity all run inside the upload request, so a student waits minutes and the request can time out. Run them in a background worker (e.g. django-q2, or Celery + Redis) and show a "processing" state. | `API/base/signals.py`, `API/base/views.py` |
| `load-models-once` | TrOCR is reloaded for every batch of 10 words and DistilBERT for every upload. Load each once per process. | `API/base/helper.py`, `API/base/signals.py` |
| `upgrade-ml-deps` | On the dev laptop, PyTorch 2.1 + transformers 4.34 crash (segfault) loading TrOCR. Upgrade both and re-run the tests. | `API/requirements.txt` |
| `real-review-page` | The Review page shows a sample PDF, placeholder text and a random duplicate score. Load a real submission instead (PDF, transcription, scores, compare). | `HMAC/src/Pages/Teachersview/`, `HMAC/src/Components/DuplicateDetection/` |
| `user-admin` | `User` is registered in the Django admin as a plain model, so passwords set there are saved unhashed. Use a `UserAdmin`. Until then, use `manage.py add_user`. | `API/base/admin.py` |
| `api-url-config` | The API address is hard-coded to localhost. Read it from `VITE_API_URL`. | `HMAC/src/utils/api.js`, `HMAC/src/Pages/LoginPage/` |
| `lint-proptypes` | `npm run lint` fails: the `react/prop-types` rule is on but no component declares PropTypes. Add them or turn the rule off. | `HMAC/.eslintrc.cjs` |
| `deploy-settings` | `DEBUG = True`, empty `ALLOWED_HOSTS`, and an old Codespaces CORS origin. Read them from `API/.env`. | `API/API/settings.py` |
| `signup-and-refresh` | No sign-up endpoint (`UserRegisterSerializer` exists but is unused), and logins expire after 60 minutes because the frontend never refreshes the token. | `HMAC/src/Pages/RegistrationPage/`, `API/API/settings.py` |

## Iteration 2: model bake-off on free Google Colab

The laptop (4 GB GPU, 7 GB RAM) can't run the newer models at a usable speed: page-level OCR took 3–55 minutes per page on CPU, and one model ran out of memory. The free Colab tier is enough for a bake-off, and it keeps the model downloads off the laptop.

The bake-off is ready to run in [`research/model_bakeoff.ipynb`](research/model_bakeoff.ipynb) ([open in Colab](https://colab.research.google.com/github/Hrishikesh-Panigrahi/HMAC/blob/main/research/model_bakeoff.ipynb)). Claude Code can also run it in an open notebook through Google's [Colab MCP server](https://github.com/googlecolab/colab-mcp).

| Tag | What | Where |
|---|---|---|
| `ocr-bakeoff` | Compare the current Roboflow + TrOCR pipeline with page-level OCR models on real handwritten pages, measuring word and character error rate against typed transcripts. Candidates that fit a free T4 in float16: `zai-org/GLM-OCR` (1.3B, MIT), `datalab-to/surya-ocr-2` (0.7B; weights free for research, personal use and small startups), `nanonets/Nanonets-OCR2-3B`, `deepseek-ai/DeepSeek-OCR-2` (3.4B), `datalab-to/chandra-ocr-2` (5.3B, tight). The winner replaces Roboflow + TrOCR, which also removes the external API and its key. | `API/base/helper.py` |
| `ai-detector-bakeoff` | Compare the current DistilBERT classifier with `desklib/ai-text-detector-academic-v1.01` and `Oxidane/tmr-ai-text-detector` on labelled human and AI answers, clean and with OCR errors. Look at false positives on human text first, then set the threshold from the results. | `API/base/signals.py`, `HMAC/src/utils/score.js` |
| `all-pages` | Only page 1 is processed, to keep uploads fast. Process every page once OCR is fast enough (GPU, or a faster model from the bake-off). | `API/base/signals.py` |

Working within the free tier:

- **GPU:** usually a T4 with about 15 GB of GPU memory and about 12 GB of RAM, but a GPU isn't guaranteed.
- **Sessions:** they disconnect when idle and are time-capped, and files are wiped when they end. Save results to Google Drive as you go.
- **Precision:** the T4 has no bfloat16, so load models with `dtype=torch.float16`.
- **Privacy:** don't upload real student handwriting without consent. Anonymise it, or use the sample pages in `API/media/coverdirectory/` for now.

## Iteration 3: real data

| Tag | What | Where |
|---|---|---|
| `real-eval-set` | Collect real handwritten answers, with consent and anonymised: independent answers to the same question, known copy pairs, and known AI-assisted answers. Use them to re-tune the duplicate-detection constants (`manage.py evaluate_similarity`), the AI threshold, and the OCR choice. The current tuning uses synthetic answers. | `API/base/similarity.py`, `API/base/evaluation_data.py` |
| `ocr-confidence` | Show how confident the OCR was for each submission, so professors know when a score rests on a poor transcription. | OCR step + Summary page |

## Iteration 4: analytics

| Tag | What | Where |
|---|---|---|
| `copy-network` | A graph of flagged pairs per assignment, to show groups (A↔B↔C). The data is already in `FileComparisonModel`. | `HMAC/src/Pages/SubmissionSummary/` |
| `answer-coverage` | Compare each answer with the model answer using sentence embeddings (e.g. `all-MiniLM-L6-v2`) to show which key points it covers. Helps grading, not just catching copying. | `HMAC/src/Pages/SubmissionSummary/`, `Assignment.reference_text` |
| `style-drift` | Compare a student's writing style across their submissions to flag answers that don't sound like them. | New |
| `paraphrase-check` | Sentence-embedding matches far above the class baseline, to catch heavy rewording that phrase matching misses. Evaluate with `evaluate_similarity` before shipping: correct answers to the same question are meant to be similar. | `API/base/similarity.py` |
