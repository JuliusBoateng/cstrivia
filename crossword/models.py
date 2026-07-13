from collections import Counter
from random import Random
from string import capwords
from unicodedata import category, combining, normalize

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models, transaction
from django.urls import reverse
from django.utils import timezone


class ContentSeries(models.TextChoices):
    PUZZLE = "puzzle", "Puzzle"
    DESIGN_NOTE = "design_note", "Design Note"
    EXHIBIT = "exhibit", "Exhibit"


class ContentSequence(models.Model):
    key = models.CharField(
        max_length=32,
        choices=ContentSeries.choices,
        unique=True,
    )
    current_value = models.PositiveIntegerField(default=0)

    @classmethod
    def allocate_number(cls, key: ContentSeries) -> int:
        with transaction.atomic():
            sequence = cls.objects.select_for_update().get(key=key)
            sequence.current_value += 1
            sequence.save(update_fields=["current_value"])
            return sequence.current_value

    @classmethod
    def ensure_at_least(cls, key: ContentSeries, value: int) -> None:
        with transaction.atomic():
            sequence = cls.objects.select_for_update().get(key=key)

            if sequence.current_value < value:
                sequence.current_value = value
                sequence.save(update_fields=["current_value"])

    def __str__(self):
        return f"{self.get_key_display()}: {self.current_value}"


class Category(models.Model):
    name = models.CharField(max_length=32, unique=True)

    class Meta:
        ordering = ["name"]

    def clean(self):
        self.name = capwords(self.name.strip())

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Board(models.Model):
    MIN_ROWS, MAX_ROWS = 5, 21
    DEFAULT_ROWS = 15

    rows = models.PositiveIntegerField(
        default=DEFAULT_ROWS,
        validators=[MinValueValidator(MIN_ROWS), MaxValueValidator(MAX_ROWS)],
    )

    cols = models.PositiveIntegerField(
        default=DEFAULT_ROWS,
        validators=[MinValueValidator(MIN_ROWS), MaxValueValidator(MAX_ROWS)],
    )

    author = models.CharField(max_length=50, null=True, blank=True)
    title = models.CharField(max_length=50, unique=True)
    puzzle_number = models.PositiveIntegerField(
        unique=True, null=True, blank=True
    )  # user visible puzzle number
    published_at = models.DateTimeField(null=True, blank=True)
    description = models.CharField(max_length=250)
    categories = models.ManyToManyField(Category, related_name="boards")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(
        auto_now=True, editable=False
    )  # also updates when saving Placements

    def get_absolute_url(self):
        return reverse("puzzle", kwargs={"puzzle_number": self.puzzle_number})

    def __str__(self):
        return f"Puzzle {self.puzzle_number}: {self.title}"

    class Meta:
        ordering = ["puzzle_number"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(cols=models.F("rows")), name="board_symmetry"
            )
        ]

    def clean(self):
        self.title = self.title.strip()
        self.description = self.description.strip()

        if self.author:
            self.author = self.author.strip()

        if self.rows != self.cols:
            raise ValidationError(
                {"rows": f"rows {self.rows} and cols {self.cols} must match."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()  # board check

        if self.puzzle_number is None:
            self.puzzle_number = ContentSequence.allocate_number(ContentSeries.PUZZLE)

        else:
            ContentSequence.ensure_at_least(
                ContentSeries.PUZZLE,
                self.puzzle_number,
            )

        super().save(*args, **kwargs)


# Questions/Answers for puzzles
class Clue(models.Model):
    board = models.ForeignKey(
        Board,
        on_delete=models.CASCADE,
        related_name="clues",
    )
    question = models.CharField(max_length=150)
    display_answer = models.CharField(max_length=21)  # Keep diacritics
    normalized_answer = models.CharField(
        max_length=21, editable=False
    )  # derived field. diacritics removed
    anagram = models.CharField(max_length=21, null=True, blank=True)

    def __str__(self):
        return self.normalized_answer

    # Filters allowed chars
    def _clean_answer(self, raw_answer: str) -> str:
        # keep unicode letters and standard 0-9 digits.
        # remove all spaces and punctuations.
        # preserve diacritics
        letters = "".join(
            c for c in raw_answer if category(c).startswith("L") or category(c) == "Nd"
        )

        return letters.upper()

    # Canonical answer removes diacritics
    def _normalize_cleaned_answer(self, cleaned_answer: str) -> str:
        # NFD decomposes chars into base + diacritic/accent.
        # Unlike NFKD, chars like ﬁ remain unchanged.
        normalized = normalize("NFD", cleaned_answer)
        stripped = "".join(
            c for c in normalized if not combining(c)
        )  # removes diacritics

        return stripped.upper()

    def clean(self):
        self.question = self.question.strip()
        self.display_answer = self._clean_answer(self.display_answer)
        self.normalized_answer = self._normalize_cleaned_answer(self.display_answer)

        if self.anagram:
            self.anagram = self._clean_answer(self.anagram)
            self.anagram = self._normalize_cleaned_answer(self.anagram)

        if len(self.display_answer) != len(self.normalized_answer):
            raise ValidationError(
                {"display_answer": "length mismatch with normalized answer."}
            )

        if self.anagram and Counter(self.anagram) != Counter(self.normalized_answer):
            raise ValidationError({"anagram": "char mismatch with normalized answer."})

    def _create_anagram(self, s: str) -> str:
        rng = Random(s)

        chars = list(s)
        rng.shuffle(chars)

        anagram = "".join(chars)
        if anagram == s:
            anagram = s[::-1]

        assert Counter(anagram) == Counter(s)
        return anagram

    def save(self, *args, **kwargs):
        self.full_clean()  # answer check
        if not self.anagram:
            self.anagram = self._create_anagram(self.normalized_answer)

        super().save(*args, **kwargs)


# Places a clue on a board and materializes its cells.
class Placement(models.Model):
    board = models.ForeignKey(
        Board, on_delete=models.CASCADE, related_name="placements"
    )
    clue = models.OneToOneField(
        Clue,
        on_delete=models.CASCADE,
        related_name="placement",
    )
    start_row = models.PositiveIntegerField()
    start_col = models.PositiveIntegerField()

    direction = models.CharField(
        max_length=1,
        choices=[
            ("A", "Across"),
            ("D", "Down"),
        ],
    )

    def __str__(self):
        return f"({self.start_row}, {self.start_col}) {self.direction}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["board", "start_row", "start_col", "direction"],
                name="placement_unique_row_col_direction",
            )
        ]

    def _bounds_check(self):
        if self.start_col >= self.board.cols:
            raise ValidationError(
                {
                    "start_col": f"col {self.start_col} exceeds board width {self.board.cols}."
                }
            )

        if self.start_row >= self.board.rows:
            raise ValidationError(
                {
                    "start_row": f"row {self.start_row} exceeds board height {self.board.rows}."
                }
            )

    def _across_direction_check(self):
        if self.direction == "A":
            col = self.start_col + len(self.clue.normalized_answer)

            if col > self.board.cols:
                raise ValidationError(
                    {"start_col": f"col {col} exceeds board width {self.board.cols}."}
                )

    def _down_direction_check(self):
        if self.direction == "D":
            row = self.start_row + len(self.clue.normalized_answer)

            if row > self.board.rows:
                raise ValidationError(
                    {"start_row": f"row {row} exceeds board height {self.board.rows}."}
                )

    def clean(self):
        if self.board_id != self.clue.board_id:
            raise ValidationError({"clue": "Placement.board must match Clue.board."})

        self._bounds_check()
        self._across_direction_check()
        self._down_direction_check()

    def _create_cells(self):
        cells = []
        for i in range(len(self.clue.normalized_answer)):
            if self.direction == "A":
                row = self.start_row
                col = self.start_col + i
                index = i
            else:
                row = self.start_row + i
                col = self.start_col
                index = i

            letter = self.clue.normalized_answer[i]

            cell = Cell(
                placement=self,
                row_index=row,
                col_index=col,
                placement_index=index,
                letter=letter,
            )
            cells.append(cell)

        return cells

    def _fetch_overlapping_cells(self):
        qs = (
            Cell.objects.select_related("placement").filter(
                placement__board=self.board
            )  # get all cells of current board
        )

        is_update = self.pk is not None
        if is_update:
            qs = qs.exclude(placement=self)  # excludes previous clue placement cells

        length = len(self.clue.normalized_answer)

        if self.direction == "A":
            col_range = (self.start_col, self.start_col + length - 1)

            qs = qs.filter(
                row_index=self.start_row,
                col_index__range=col_range,
            )
        else:
            row_range = (self.start_row, self.start_row + length - 1)

            qs = qs.filter(
                col_index=self.start_col,
                row_index__range=row_range,
            )

        return qs

    def _validate_cells(self, new_cells, overlapping_cells):
        overlapping_by_coord = {
            (c.row_index, c.col_index): c for c in overlapping_cells
        }

        for cell in new_cells:
            coord = (cell.row_index, cell.col_index)
            overlapping = overlapping_by_coord.get(coord)
            if not overlapping:
                continue

            # Rule 1: Cannot overlap same direction
            if overlapping.placement.direction == self.direction:
                raise ValidationError(
                    f"Overlapping clues cannot share direction: '{self.direction}'."
                )

            # Rule 2: Letters must match
            if overlapping.letter != cell.letter:
                raise ValidationError(
                    f"letter conflict at coord ({cell.row_index},{cell.col_index}); '{cell.letter}' != '{overlapping.letter}'."
                )

    def _delete_previous_cells(self):
        is_update = self.pk is not None
        if is_update:  # delete previous placement cells
            self.cells.all().delete()

    def save(self, *args, **kwargs):
        self.full_clean()  # bound checks

        new_cells = self._create_cells()
        overlapping_cells = self._fetch_overlapping_cells()
        self._validate_cells(new_cells, overlapping_cells)

        # transactions automatically rollback in case of error
        with transaction.atomic():
            self._delete_previous_cells()

            super().save(*args, **kwargs)  # must save placement before creating cells
            Cell.objects.bulk_create(new_cells)  # create new placement cells

        self.board.updated_at = timezone.now()
        self.board.save(update_fields=["updated_at"])


# Created through Placements. Write-only materialized projection.
class Cell(models.Model):
    placement = models.ForeignKey(
        Placement, on_delete=models.CASCADE, related_name="cells"
    )
    row_index = models.PositiveIntegerField()
    col_index = models.PositiveIntegerField()
    placement_index = models.PositiveIntegerField()
    letter = models.CharField(max_length=1)

    def __str__(self):
        return f"({self.row_index}, {self.col_index}) {self.letter}"

    class Meta:
        ordering = ["placement_index"]
        constraints = [
            models.UniqueConstraint(
                fields=["placement", "row_index", "col_index"],
                name="cell_unique_placement_row_col",
            ),
            models.UniqueConstraint(
                fields=["placement", "placement_index"],
                name="cell_unique_placement_placement_index",
            ),
        ]
        indexes = [
            models.Index(fields=["row_index", "col_index"], name="cell_row_col_idx")
        ]

    # Placement calls bulk_create which bypasses save()
    def save(self, *args, **kwargs):
        raise ValueError("Cell is a projection and cannot be saved directly.")


class MarkdownContent(models.Model):
    title = models.CharField(max_length=50, unique=True)
    author = models.CharField(max_length=50, blank=True)
    body = models.TextField()  # markdown

    created_at = models.DateTimeField(auto_now_add=True)
    published_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    class Meta:
        abstract = True

    def clean(self):
        super().clean()
        self.title = self.title.strip()

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


# Design Notes Section
class DesignCategory(models.Model):
    name = models.CharField(max_length=32, unique=True)

    class Meta:
        ordering = ["name"]

    def clean(self):
        self.name = capwords(self.name.strip())

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class DesignNote(MarkdownContent):
    design_number = models.PositiveIntegerField(
        unique=True,
        null=True,
        blank=True,
    )  # user visible number

    boards = models.ManyToManyField(
        Board,
        blank=True,
        related_name="design_notes",
    )

    categories = models.ManyToManyField(
        DesignCategory,
        blank=True,
        related_name="design_notes",
    )

    class Meta:
        ordering = ["design_number"]

    def __str__(self):
        return f"Design {self.design_number}: {self.title}"

    def get_absolute_url(self):
        return reverse(
            "design_note",
            kwargs={"design_number": self.design_number},
        )

    def save(self, *args, **kwargs):
        if self.design_number is None:
            self.design_number = ContentSequence.allocate_number(
                ContentSeries.DESIGN_NOTE
            )

        else:
            ContentSequence.ensure_at_least(
                ContentSeries.DESIGN_NOTE,
                self.design_number,
            )

        super().save(*args, **kwargs)


class Exhibit(MarkdownContent):
    exhibit_number = models.PositiveIntegerField(
        unique=True,
        null=True,
        blank=True,
    )  # user visible number

    categories = models.ManyToManyField(
        Category,
        blank=True,
        related_name="exhibits",
    )

    class Meta:
        ordering = ["exhibit_number"]

    def __str__(self):
        return f"Exhibit {self.exhibit_number}: {self.title}"

    def get_absolute_url(self):
        return reverse(
            "exhibit",
            kwargs={"exhibit_number": self.exhibit_number},
        )

    def save(self, *args, **kwargs):
        if self.exhibit_number is None:
            self.exhibit_number = ContentSequence.allocate_number(ContentSeries.EXHIBIT)

        else:
            ContentSequence.ensure_at_least(
                ContentSeries.EXHIBIT,
                self.exhibit_number,
            )

        super().save(*args, **kwargs)
