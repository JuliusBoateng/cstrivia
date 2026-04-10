import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from crossword.models import DesignNote


class Command(BaseCommand):
    help = "Export one design note to JSON by design_number."

    def add_arguments(self, parser):
        parser.add_argument("design_number", type=int)
        parser.add_argument(
            "--output",
            type=str,
            help="Optional output path. Defaults to design_<number>.json",
        )

    def handle(self, *args, **options):
        design_number = options["design_number"]

        note = (
            DesignNote.objects
            .prefetch_related("categories", "boards")
            .filter(design_number=design_number)
            .first()
        )

        if not note:
            raise CommandError(
                f"Design note with design_number={design_number} does not exist."
            )

        payload = {
            "design_note": {
                "title": note.title,
                "design_number": note.design_number,
                "author": note.author,
                "published_at": (
                    note.published_at.isoformat() if note.published_at else None
                ),
                "body": note.body,
                "categories": sorted(category.name for category in note.categories.all()),
                "boards": sorted(board.puzzle_number for board in note.boards.all()),
            }
        }

        output_path = options["output"] or f"design_{design_number}.json"
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

        self.stdout.write(self.style.SUCCESS(f"Exported design note to {path}"))
