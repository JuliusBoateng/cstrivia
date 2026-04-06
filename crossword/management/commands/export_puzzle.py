import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from crossword.models import Board


class Command(BaseCommand):
    help = "Export one puzzle by puzzle_number to compact JSON."

    def add_arguments(self, parser):
        parser.add_argument("puzzle_number", type=int)
        parser.add_argument(
            "--out",
            type=str,
            help="Optional output file path. Prints to stdout if omitted.",
        )

    def handle(self, *args, **options):
        puzzle_number = options["puzzle_number"]
        out_path = options.get("out")

        try:
            board = (
                Board.objects
                .prefetch_related("categories", "clue_placements__clue")
                .get(puzzle_number=puzzle_number)
            )
        except Board.DoesNotExist:
            raise CommandError(f"Board with puzzle_number={puzzle_number} does not exist.")

        clue_entries = []
        placements = board.clue_placements.select_related("clue").all().order_by(
            "direction", "start_row", "start_col"
        )

        for placement in placements:
            clue_entries.append({
                "question": placement.clue.question,
                "display_answer": placement.clue.display_answer,
                "direction": placement.direction,
                "start_row": placement.start_row,
                "start_col": placement.start_col,
            })

        payload = {
            "board": {
                "title": board.title,
                "author": board.author,
                "puzzle_number": board.puzzle_number,
                "published_at": board.published_at.isoformat() if board.published_at else None,
                "description": board.description,
                "rows": board.rows,
                "cols": board.cols,
                "categories": [category.name for category in board.categories.all()],
            },
            "clues": clue_entries,
        }

        json_text = json.dumps(payload, indent=2, ensure_ascii=False)

        if out_path:
            path = Path(out_path)
            path.write_text(json_text + "\n", encoding="utf-8")
            self.stdout.write(self.style.SUCCESS(f"Exported puzzle to {path}"))
        else:
            self.stdout.write(json_text)