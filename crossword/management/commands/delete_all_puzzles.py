from django.core.management.base import BaseCommand
from crossword.models import Board, Clue

class Command(BaseCommand):
    help = "Delete all puzzle data"

    def handle(self, *args, **kwargs):
        confirmation = input(
            "This will permanently delete ALL puzzles.\n"
            "Type 'delete all puzzles' to continue: "
        )

        if confirmation.strip().lower() != "delete all puzzles":
            self.stdout.write(self.style.WARNING("Aborted. No puzzles were deleted."))
            return

        clue_count, _ = Clue.objects.all().delete()
        board_count, _ = Board.objects.all().delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted {board_count} boards and {clue_count} clues."
            )
        )