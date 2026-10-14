# HMAC

HMAC checks handwritten assignments. Students upload a scanned PDF; HMAC reads the handwriting with OCR, estimates how likely the text is AI-written, and compares it with every other answer to the same assignment to find copied passages. Professors review the results in a summary, with the shared passages highlighted side by side.

| Folder | What's in it |
|---|---|
| `API/` | Django + Django REST Framework backend (`API/base` is the app) |
| `HMAC/` | React + Vite frontend |

## Publication

HMAC is described in our paper: <https://doi.org/10.6977/IJoSI.202506_9(3).0005>

Duplicate detection has changed since the paper. The original word-frequency (TF-IDF) comparison was replaced with phrase matching within each assignment, which ignores the question paper and wording most of the class shares. We're continuing to iterate on the pipeline as newer OCR, AI-detection and similarity models come out; see [ROADMAP.md](ROADMAP.md) for what's planned.

## How a submission is processed

1. The student picks an assignment and uploads a PDF (`POST /api/v1/Upload/`).
2. The first page is converted to an image (Poppler via `pdf2image`).
3. Words are located with a Roboflow word-detection model and read with TrOCR (`microsoft/trocr-base-handwritten`), then grammar-corrected with LanguageTool.
4. A DeBERTa-v3 detector ([`desklib/ai-text-detector-academic-v1.01`](https://huggingface.co/desklib/ai-text-detector-academic-v1.01)) scores how likely the raw OCR text is AI-generated. See `API/base/ai_detection.py`.
5. Duplicate detection re-scores the whole assignment: 4-word phrases are compared (one word may differ, so OCR slips don't hide copying), ignoring phrases from the assignment's question paper / model answer and phrases most of the class uses. See `API/base/similarity.py`.

All of this runs inside the upload request, so an upload takes a while.

## Prerequisites

- **Python 3.10**
- **Node.js 18+**
- **Poppler**: `apt install poppler-utils` (Linux), `brew install poppler` (macOS), or on Windows download a build from [poppler-windows](https://github.com/oschwartz10612/poppler-windows/releases) and either add its `Library\bin` folder to PATH or set `POPPLER_PATH` (below).
- **Java 8+**: LanguageTool (the grammar step) needs it and downloads itself on first use.
- **A Roboflow API key** for the word-detection model.
- **About 2 GB of disk space** for the AI-detection model. It downloads from Hugging Face on the first upload and is cached for later runs.

## Setup

```bash
git clone https://github.com/Hrishikesh-Panigrahi/HMAC.git
```

### Backend

```bash
cd API
python -m venv env
env\Scripts\activate          # Windows
source env/bin/activate       # macOS / Linux
pip install -r requirements.txt
```

Create `API/.env` from the example and fill it in. `API/.env` is git-ignored; never commit it.

```bash
cp .env.example .env
```

| Setting | Required | Notes |
|---|---|---|
| `DJANGO_SECRET_KEY` | yes | Signs sessions and login tokens. Generate one with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `ROBOFLOW_API_KEY` | for uploads | Word detection in the OCR step |
| `POPPLER_PATH` | only if Poppler isn't on PATH | Folder containing `pdftoppm` |

Create the database and an account for each role:

```bash
python manage.py migrate
python manage.py add_user prof@school.edu --name "Your Name" --professor
python manage.py add_user student@school.edu --name "A Student" --user-id 42
python manage.py runserver
```

`add_user` asks for the password and stores it hashed. Professors see the Review and Summary pages; students see Upload.

For the Django admin at `/admin`, create a superuser with `python manage.py createsuperuser`. Don't type passwords into the admin's user form: it saves them unhashed, so the account can't log in. Set passwords with `python manage.py changepassword <email>` instead.

### Frontend

```bash
cd HMAC
npm install
npm run dev
```

Open http://localhost:5173. The frontend expects the API at `http://localhost:8000` (see `HMAC/src/utils/api.js`).

## Using it

1. As a professor, open **Summary**, choose **New assignment**, and paste the question paper (and any textbook definitions students are expected to reproduce). Phrases from that text don't count as copying.
2. Students sign in, pick the assignment on **Upload**, and hand in their PDF.
3. The Summary shows each submission's AI score and closest match. **compare** opens both answers with the shared passages highlighted.

Scores are signals, not verdicts: read the transcription before acting on one.

## Management commands

Run from `API/` with the virtualenv active.

| Command | What it does |
|---|---|
| `python manage.py test base` | Backend tests |
| `python manage.py add_user EMAIL --name NAME [--professor] [--user-id ID]` | Create an account with a hashed password |
| `python manage.py recompute_similarity` | Re-score duplicate content for every assignment (after changing `similarity.py`) |
| `python manage.py rescore_ai_detection` | Re-score AI detection for every submission (after changing the detector) |
| `python manage.py seed_demo_assignment` | Add a demo assignment with six sample answers (`--delete` removes it) |
| `python manage.py evaluate_similarity [--sweep]` | Measure how well duplicate detection separates copied from honest answers |

## Duplicate detection accuracy

The thresholds in `API/base/similarity.py` were tuned with `evaluate_similarity`: 20 independent answers to 4 questions, copies generated from them, and simulated OCR errors at a 10% word error rate (about what the current pipeline gets on real handwriting) plus 20% as a stress test. At typical OCR quality, no honest answer was flagged, while every whole-answer copy was. Copying only a sentence or two is often missed.

The evaluation set is synthetic. Once you have real submissions, re-run `evaluate_similarity` and adjust the constants at the top of `similarity.py`.

## AI detection accuracy

The detector was chosen in a bake-off on free Colab ([`research/model_bakeoff.ipynb`](research/model_bakeoff.ipynb)) against the previous DistilBERT model and one other detector. The test set had 45 human and 45 ChatGPT answers from the HC3 dataset, plus 20 answers written by a current model, all with simulated OCR errors at a 10% word error rate. With the threshold set so about 5% of human answers were flagged, it caught 93% of the ChatGPT answers (DistilBERT: 11%) and 10% of the current model's answers. It's meant for text from widely used chatbots, not the newest models.

HMAC flags an answer at 95% or more: on that set, 1 of 45 human answers (2%) and 42 of 45 ChatGPT answers (93%). From 80% it's marked worth a look (11% of human answers, every ChatGPT one). The set is small, so re-check these with real submissions (`research/ai_detector_thresholds.py`).

Answers under 100 words are marked low confidence and aren't flagged on their AI score.

## Known limitations

- Only the first page of each PDF is processed, to keep uploads fast enough.
- Processing runs inside the upload request rather than a background job.
- There is no self sign-up; accounts are created with `add_user`.
- Logins expire after 60 minutes and aren't renewed automatically.
