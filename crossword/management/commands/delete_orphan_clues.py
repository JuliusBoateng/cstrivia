from django.core.management.base import BaseCommand
from crossword.models import Clue


class Command(BaseCommand):
    help = "Delete clues not referenced by any clue placement."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show how many orphan clues would be deleted without deleting them.",
        )

    def handle(self, *args, **options):
        qs = Clue.objects.filter(clueplacement__isnull=True)
        count = qs.count()

        if options["dry_run"]:
            self.stdout.write(f"{count} orphan clues would be deleted.")
            return

        if count == 0:
            self.stdout.write("No orphan clues found.")
            return

        self.stdout.write(
            self.style.WARNING(
                f"{count} orphan clues will be permanently deleted."
            )
        )

        confirm = input("Type 'delete' to confirm: ")

        if confirm != "delete":
            self.stdout.write("Aborted.")
            return

        qs.delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {count} orphan clues."))