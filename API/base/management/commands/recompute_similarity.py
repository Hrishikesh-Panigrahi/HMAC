from django.core.management.base import BaseCommand

from base.similarity import recompute_all


class Command(BaseCommand):
    help = "Re-score duplicate content for every assignment with the current similarity method."

    def handle(self, *args, **options):
        for assignment_id, rows in recompute_all().items():
            label = f"assignment {assignment_id}" if assignment_id else "submissions without an assignment"
            self.stdout.write(f"{label}: {rows} comparison rows")
        self.stdout.write(self.style.SUCCESS("Done."))
