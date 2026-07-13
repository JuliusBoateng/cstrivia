# crossword/management/commands/sync_content_sequences.py

from django.core.management.base import BaseCommand
from django.db.models import Max

from crossword.models import (
    Board,
    ContentSequence,
    ContentSeries,
    DesignNote,
    Exhibit,
)


class Command(BaseCommand):
    help = "Initialize or synchronize public content sequences."

    def handle(self, *args, **options):
        sequences = {
            ContentSeries.PUZZLE: (
                Board,
                "puzzle_number",
            ),
            ContentSeries.DESIGN_NOTE: (
                DesignNote,
                "design_number",
            ),
            ContentSeries.EXHIBIT: (
                Exhibit,
                "exhibit_number",
            ),
        }

        for key, (model, number_field) in sequences.items():
            maximum = (
                model.objects.aggregate(
                    maximum=Max(number_field),
                )["maximum"]
                or 0
            )

            sequence, created = ContentSequence.objects.get_or_create(
                key=key,
                defaults={"current_value": maximum},
            )

            if created:
                action = "Created"

            elif sequence.current_value < maximum:
                sequence.current_value = maximum

                sequence.save(update_fields=["current_value"])

                action = "Updated"

            else:
                action = "Unchanged"

            self.stdout.write(
                self.style.SUCCESS(
                    f"{action} {sequence.get_key_display()} sequence "
                    f"at {sequence.current_value}."
                )
            )
