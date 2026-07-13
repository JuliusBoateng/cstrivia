import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_datetime

from crossword.models import Category, Exhibit


class Command(BaseCommand):
    help = "Load or update one exhibit JSON file or all exhibit JSON files in a directory."

    def add_arguments(self, parser):
        parser.add_argument(
            "path",
            type=str,
            help="Path to an exhibit JSON file or directory",
        )

    def handle(self, *args, **options):
        input_path = Path(options["path"])

        if not input_path.exists():
            raise CommandError(f"Path not found: {input_path}")

        if input_path.is_file():
            json_files = [input_path]

        elif input_path.is_dir():
            json_files = sorted(
                path
                for path in input_path.iterdir()
                if path.is_file() and path.suffix.lower() == ".json"
            )

            if not json_files:
                raise CommandError(
                    f"No JSON files found in directory: {input_path}"
                )

        else:
            raise CommandError(f"Unsupported path type: {input_path}")

        for json_file in json_files:
            try:
                action, title = self._load_exhibit(json_file)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"{action} exhibit: {title} ({json_file.name})"
                    )
                )
            except Exception as exc:
                raise CommandError(
                    f"Failed loading {json_file}: {exc}"
                ) from exc

    @transaction.atomic
    def _load_exhibit(self, json_path: Path) -> tuple[str, str]:
        try:
            data = json.loads(json_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise CommandError(f"Invalid JSON: {exc}") from exc

        exhibit_data = data.get("exhibit")
        if not exhibit_data:
            raise CommandError(
                "JSON must contain a top-level 'exhibit' object."
            )

        title = exhibit_data.get("title")
        exhibit_number = exhibit_data.get("exhibit_number")
        published_at_raw = exhibit_data.get("published_at")
        author = exhibit_data.get("author", "")
        body = exhibit_data.get("body", "")
        category_names = exhibit_data.get("categories", [])

        if not title:
            raise CommandError("Exhibit title is required.")

        if exhibit_number is None:
            raise CommandError("Exhibit exhibit_number is required.")

        published_at = None
        if published_at_raw:
            published_at = parse_datetime(published_at_raw)
            if published_at is None:
                raise CommandError(
                    f"Could not parse published_at: {published_at_raw}"
                )

        exhibit_by_number = Exhibit.objects.filter(
            exhibit_number=exhibit_number
        ).first()
        exhibit_by_title = Exhibit.objects.filter(title=title).first()

        if (
            exhibit_by_number
            and exhibit_by_title
            and exhibit_by_number.pk != exhibit_by_title.pk
        ):
            raise CommandError(
                f"Conflict detected: exhibit_number={exhibit_number} matches "
                f"exhibit id={exhibit_by_number.pk}, but title='{title}' matches "
                f"exhibit id={exhibit_by_title.pk}."
            )

        existing_exhibit = exhibit_by_number or exhibit_by_title
        exhibit = existing_exhibit or Exhibit()

        exhibit.title = title
        exhibit.exhibit_number = exhibit_number
        exhibit.author = author
        exhibit.published_at = published_at
        exhibit.body = body
        exhibit.save()

        categories = []
        for raw_name in category_names:
            name = raw_name.strip()
            if not name:
                continue

            category, _ = Category.objects.get_or_create(name=name)
            categories.append(category)

        exhibit.categories.set(categories)

        action = "Updated" if existing_exhibit else "Created"
        return action, exhibit.title