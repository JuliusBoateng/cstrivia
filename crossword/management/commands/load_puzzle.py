import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_datetime

from crossword.models import Board, Category, Clue, CluePlacement


class Command(BaseCommand):
    help = "Load or update one puzzle JSON file or all puzzle JSON files in a directory."

    def add_arguments(self, parser):
        parser.add_argument("path", type=str, help="Path to a puzzle JSON file or directory of puzzle JSON files")

    def handle(self, *args, **options):
        input_path = Path(options["path"])

        if not input_path.exists():
            raise CommandError(f"Path not found: {input_path}")

        if input_path.is_file():
            json_files = [input_path]
        elif input_path.is_dir():
            json_files = sorted(
                p for p in input_path.iterdir()
                if p.is_file() and p.suffix.lower() == ".json"
            )
            if not json_files:
                raise CommandError(f"No JSON files found in directory: {input_path}")
        else:
            raise CommandError(f"Unsupported path type: {input_path}")

        for json_file in json_files:
            try:
                action, board_title = self._load_puzzle_file(json_file)
                self.stdout.write(self.style.SUCCESS(f"{action} puzzle: {board_title} ({json_file.name})"))
            except Exception as exc:
                raise CommandError(f"Failed loading {json_file}: {exc}") from exc

    @transaction.atomic
    def _load_puzzle_file(self, json_path: Path) -> tuple[str, str]:
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
        return action, board.title