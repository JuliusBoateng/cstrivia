import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from crossword.models import Exhibit


class Command(BaseCommand):
    help = "Export one exhibit to JSON by exhibit_number."

    def add_arguments(self, parser):
        parser.add_argument("exhibit_number", type=int)
        parser.add_argument(
            "--output",
            type=str,
            help="Optional output path. Defaults to exhibit_<number>.json",
        )

    def handle(self, *args, **options):
        exhibit_number = options["exhibit_number"]

        exhibit = (
            Exhibit.objects.prefetch_related("categories")
            .filter(exhibit_number=exhibit_number)
            .first()
        )

        if not exhibit:
            raise CommandError(
                f"Exhibit with exhibit_number={exhibit_number} does not exist."
            )

        payload = {
            "exhibit": {
                "title": exhibit.title,
                "exhibit_number": exhibit.exhibit_number,
                "author": exhibit.author,
                "published_at": (
                    exhibit.published_at.isoformat()
                    if exhibit.published_at
                    else None
                ),
                "body": exhibit.body,
                "categories": sorted(
                    category.name for category in exhibit.categories.all()
                ),
            }
        }

        output_path = options["output"] or f"exhibit_{exhibit_number}.json"
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

        self.stdout.write(
            self.style.SUCCESS(f"Exported exhibit to {path}")
        )