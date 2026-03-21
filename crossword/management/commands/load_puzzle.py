import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_datetime

from crossword.models import Board, Category, Clue, CluePlacement


class Command(BaseCommand):
    help = "Load one puzzle from compact JSON."

    def add_arguments(self, parser):
        parser.add_argument("json_path", type=str)

    @transaction.atomic
    def handle(self, *args, **options):
        json_path = Path(options["json_path"])
        if not json_path.exists():
            raise CommandError(f"File not found: {json_path}")

        data = json.loads(json_path.read_text(encoding="utf-8"))

        board_data = data.get("board")
        clue_data = data.get("clues")

        if not board_data or not clue_data:
            raise CommandError("JSON must contain 'board' and 'clues'.")

        published_at = board_data.get("published_at")
        parsed_published_at = parse_datetime(published_at) if published_at else None

        existing_board = Board.objects.filter(title=board_data["title"]).first()

        if existing_board:
            board = existing_board
            board.author = board_data.get("author")
            board.puzzle_number = board_data.get("puzzle_number")
            board.published_at = parsed_published_at
            board.description = board_data["description"]
            board.rows = board_data["rows"]
            board.cols = board_data["cols"]
        else:
            board = Board(
                title=board_data["title"],
                author=board_data.get("author"),
                puzzle_number=board_data.get("puzzle_number"),
                published_at=parsed_published_at,
                description=board_data["description"],
                rows=board_data["rows"],
                cols=board_data["cols"],
            )

        board.save()

        categories = []
        for raw_name in board_data.get("categories", []):
            name = raw_name.strip().title()
            category, _ = Category.objects.get_or_create(name=name)
            categories.append(category)
        board.categories.set(categories)

        board.clue_placements.all().delete()

        for entry in clue_data:
            clue, _ = Clue.objects.get_or_create(
                question=entry["question"],
                display_answer=entry["display_answer"],
            )

            CluePlacement.objects.create(
                board=board,
                clue=clue,
                start_row=entry["start_row"],
                start_col=entry["start_col"],
                direction=entry["direction"],
            )

        self.stdout.write(self.style.SUCCESS(f"Loaded puzzle: {board.title}"))