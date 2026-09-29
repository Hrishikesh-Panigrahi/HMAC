from django.core.management.base import BaseCommand

from base.evaluation import BAD_WER, COPY_KINDS, TYPICAL_WER, detection_rates, evaluate, separation, summarize

MODES = {
    "question": "question paper pasted",
    "question+textbook": "question paper + textbook text pasted",
}


class Command(BaseCommand):
    help = "Measure how well duplicate detection separates copied answers from honest ones (see base/evaluation.py)."

    def add_arguments(self, parser):
        parser.add_argument("--seeds", type=int, default=3, help="Random OCR-noise runs to average over.")
        parser.add_argument("--sweep", action="store_true", help="Also compare phrase lengths, exact vs fuzzy.")

    def handle(self, *args, **options):
        seeds = options["seeds"]
        self.stdout.write("Current settings. Cells: flagged 'worth a look' or higher / flagged high.\n")
        header = f"{'model answer':40} {'OCR noise':>9} | " + " | ".join(f"{k:>11}" for k in ("independent",) + COPY_KINDS)
        self.stdout.write(header)
        self.stdout.write("-" * len(header))
        for mode, label in MODES.items():
            for wer in (TYPICAL_WER, BAD_WER):
                rates = detection_rates(evaluate(mode=mode, wer=wer, seeds=seeds))
                cells = " | ".join(f"{rates[k][0] * 100:4.0f}%/{rates[k][1] * 100:4.0f}%" for k in ("independent",) + COPY_KINDS)
                self.stdout.write(f"{label:40} {wer * 100:8.0f}% | {cells}")

        if options["sweep"]:
            self.stdout.write("\nPhrase length sweep (question paper pasted). Closest-match %: honest p95 | copies median")
            for wer in (TYPICAL_WER, BAD_WER):
                for fuzzy, lengths in ((False, (3, 4, 5)), (True, (4, 5, 6))):
                    for n in lengths:
                        s = summarize(evaluate(n=n, fuzzy=fuzzy, wer=wer, seeds=seeds))
                        copies = "  ".join(f"{k} {s[k]['median'] * 100:4.1f}" for k in COPY_KINDS)
                        self.stdout.write(
                            f"  {'fuzzy' if fuzzy else 'exact'} n={n} noise {wer * 100:.0f}%: "
                            f"honest {s['independent']['p95'] * 100:4.1f} | {copies} | separation {separation(s) * 100:5.1f}")
