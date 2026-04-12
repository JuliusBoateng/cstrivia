import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_datetime

from crossword.models import Board, DesignCategory, DesignNote


class Command(BaseCommand):
    help = "Load or update one design note JSON file or all design note JSON files in a directory."

    def add_arguments(self, parser):
        parser.add_argument("path", type=str, help="Path to a design note JSON file or directory")

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
                action, title = self._load_design_note(json_file)
                self.stdout.write(
                    self.style.SUCCESS(f"{action} design note: {title} ({json_file.name})")
                )
            except Exception as exc:
                raise CommandError(f"Failed loading {json_file}: {exc}") from exc

    @transaction.atomic
    def _load_design_note(self, json_path: Path) -> tuple[str, str]:
        try:
            data = json.loads(json_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise CommandError(f"Invalid JSON: {exc}") from exc

        note_data = data.get("design_note")
        if not note_data:
            raise CommandError("JSON must contain a top-level 'design_note' object.")

        title = note_data.get("title")
        design_number = note_data.get("design_number")
        published_at_raw = note_data.get("published_at")
        author = note_data.get("author", "")
        body = note_data.get("body", "")
        category_names = note_data.get("categories", [])
        board_numbers = note_data.get("boards", [])

        if not title:
            raise CommandError("Design note title is required.")
        if design_number is None:
            raise CommandError("Design note design_number is required.")

        published_at = None
        if published_at_raw:
            published_at = parse_datetime(published_at_raw)
            if published_at is None:
                raise CommandError(
                    f"Could not parse published_at: {published_at_raw}"
                )

        note_by_number = DesignNote.objects.filter(design_number=design_number).first()
        note_by_title = DesignNote.objects.filter(title=title).first()

        if note_by_number and note_by_title and note_by_number.pk != note_by_title.pk:
            raise CommandError(
                f"Conflict detected: design_number={design_number} matches "
                f"design note id={note_by_number.pk}, but title='{title}' matches "
                f"design note id={note_by_title.pk}."
            )

        existing_note = note_by_number or note_by_title
        note = existing_note or DesignNote()

        note.title = title
        note.design_number = design_number
        note.author = author
        note.published_at = published_at
        note.body = body
        note.save()

        categories = []
        for raw_name in category_names:
            name = raw_name.strip()
            if not name:
                continue
            category, _ = DesignCategory.objects.get_or_create(name=name)
            categories.append(category)

        boards = []
        for puzzle_number in board_numbers:
            board = Board.objects.filter(puzzle_number=puzzle_number).first()
            if not board:
                raise CommandError(
                    f"Board with puzzle_number={puzzle_number} does not exist."
                )
            boards.append(board)

        note.categories.set(categories)
        note.boards.set(boards)

        action = "Updated" if existing_note else "Created"
        return action, note.title