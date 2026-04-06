from django.core.management.base import BaseCommand
from crossword.models import Board


class Command(BaseCommand):
    help = "Delete a puzzle by puzzle_number"

    def add_arguments(self, parser):
        parser.add_argument("puzzle_id", type=int, help="Puzzle number to delete")

    def handle(self, *args, **kwargs):
        puzzle_id = kwargs["puzzle_id"]

        try:
            board = Board.objects.get(puzzle_number=puzzle_id)
        except Board.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f"Puzzle {puzzle_id} does not exist.")
            )
            return

        confirmation = input(
            f"This will permanently delete puzzle {puzzle_id} "
            f"('{board.title}').\n"
            "Type 'delete puzzle' to continue: "
        )

        if confirmation.strip().lower() != "delete puzzle":
            self.stdout.write(self.style.WARNING("Aborted. No puzzle was deleted."))
            return

        board.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted puzzle {puzzle_id} ({board.title})."
            )
        )