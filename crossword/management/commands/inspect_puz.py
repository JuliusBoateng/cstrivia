import puz

from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Inspect a .puz crossword file and print answer coordinates."

    def add_arguments(self, parser):
        parser.add_argument(
            "puz_path",
            type=str,
            help="Path to the .puz file to inspect.",
        )

        parser.add_argument(
            "-r",
            "--row-offset",
            type=int,
            default=0,
            help="Row translation offset to apply to coordinates.",
        )

        parser.add_argument(
            "-c",
            "--col-offset",
            type=int,
            default=0,
            help="Column translation offset to apply to coordinates.",
        )

    def handle(self, *args, **options):
        path = options["puz_path"]
        row_offset = options["row_offset"]
        col_offset = options["col_offset"]

        try:
            puzzle = puz.read(path)
        except Exception as exc:
            raise CommandError(f"Failed to read .puz file: {exc}") from exc

        width = puzzle.width
        height = puzzle.height
        grid = puzzle.solution

        def cell(r, c):
            return grid[r * width + c]

        def filled(r, c):
            return cell(r, c).isalnum()

        results = []

        for r in range(height):
            for c in range(width):
                if not filled(r, c):
                    continue

                # Across start
                if c == 0 or not filled(r, c - 1):
                    word = ""
                    cc = c
                    while cc < width and filled(r, cc):
                        word += cell(r, cc)
                        cc += 1

                    if len(word) > 1:
                        results.append((word, r, c, "Across"))

                # Down start
                if r == 0 or not filled(r - 1, c):
                    word = ""
                    rr = r
                    while rr < height and filled(rr, c):
                        word += cell(rr, c)
                        rr += 1

                    if len(word) > 1:
                        results.append((word, r, c, "Down"))

        results.sort(key=lambda x: (x[1], x[2]))

        for word, r, c, direction in results:
            r += row_offset
            c += col_offset

            self.stdout.write(word)
            self.stdout.write(f"({r}, {c})")
            self.stdout.write(direction)
            self.stdout.write("")