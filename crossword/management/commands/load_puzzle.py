import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_datetime

from crossword.models import Board, Category, Clue, CluePlacement


class Command(BaseCommand):
    help = "Load or update one puzzle from compact JSON."

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

        title = board_data.get("title")
        puzzle_number = board_data.get("puzzle_number")
        published_at = board_data.get("published_at")
        parsed_published_at = parse_datetime(published_at) if published_at else None

        if not title:
            raise CommandError("Board title is required.")
        if puzzle_number is None:
            raise CommandError("Board puzzle_number is required.")

        board_by_number = Board.objects.filter(puzzle_number=puzzle_number).first()
        board_by_title = Board.objects.filter(title=title).first()

        if board_by_number and board_by_title and board_by_number.pk != board_by_title.pk:
            raise CommandError(
                f"Conflict detected: puzzle_number={puzzle_number} matches "
                f"board id={board_by_number.pk}, but title='{title}' matches "
                f"board id={board_by_title.pk}."
            )

        board = board_by_number or board_by_title or Board()

        board.title = title
        board.author = board_data.get("author")
        board.puzzle_number = puzzle_number
        board.published_at = parsed_published_at
        board.description = board_data["description"]
        board.rows = board_data["rows"]
        board.cols = board_data["cols"]
        board.save()

        categories = []
        for raw_name in board_data.get("categories", []):
            name = raw_name.strip()
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

        action = "Updated" if board_by_number or board_by_title else "Created"
        self.stdout.write(self.style.SUCCESS(f"{action} puzzle: {board.title}"))