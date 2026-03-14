from string import capwords

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models, transaction
from django.utils import timezone
from unicodedata import category, normalize, combining

class Category(models.Model):
    name = models.CharField(max_length=16, unique=True)

    class Meta:
        ordering = ["name"]

    def clean(self):
        self.name = capwords(self.name)

class Board(models.Model):
    MIN_ROWS, MAX_ROWS = 5, 21
    DEFAULT_ROWS = 15

    rows = models.PositiveIntegerField(
        default=DEFAULT_ROWS,
        validators=[
            MinValueValidator(MIN_ROWS),
            MaxValueValidator(MAX_ROWS)
            ]
        )
    
    cols = models.PositiveIntegerField(
        default=DEFAULT_ROWS,
        validators=[
            MinValueValidator(MIN_ROWS),
            MaxValueValidator(MAX_ROWS)
            ]
        )
    
    title = models.CharField(max_length=50, unique=True)
    puzzle_number = models.PositiveIntegerField(unique=True, blank=True) # user visible puzzle number
    published = models.BooleanField(default=False)
    description = models.CharField(max_length=200)
    categories = models.ManyToManyField(Category, related_name="boards")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, editable=False) # also updates when saving CluePlacement
    
    class Meta:
        ordering = ["puzzle_number"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(cols=models.F("rows")),
                name="board_symmetry"
            )
        ]

    def clean(self):
        self.title = self.title.strip().title()

        if self.rows != self.cols:
            raise ValidationError(
                {"rows": f"rows {self.rows} and cols {self.cols} must match."}
            )

    def save(self, *args, **kwargs):
        self.full_clean() # board check

        if self.puzzle_number is None:
            with transaction.atomic():
                current_puzzle_number = Board.objects.aggregate(
                    max_num=models.Max('puzzle_number', default=0)
                    )['max_num']
                
                self.puzzle_number = current_puzzle_number + 1

        super().save(*args, **kwargs)


'''
Questions/Answers for puzzles
'''
class Clue(models.Model):
    question = models.CharField(max_length=150)
    display_answer = models.CharField(max_length=21) # Keep diacritics
    normalized_answer = models.CharField(max_length=21, editable=False) # derived field. diacritics removed
    categories = models.ManyToManyField(Category, related_name="clues", null=True, blank=True)
    
    '''
    Filters allowed chars
    '''
    def _clean_answer(self, raw_answer: str) -> str:
        # keep unicode letters and standard 0-9 digits.
        # remove all spaces and punctuations.
        # preserve diacritics
        letters = "".join(
            c for c in raw_answer
            if category(c).startswith("L")
            or category(c) == "Nd"
        )
        
        return letters.upper()
    
    '''
    Canonical answer removes diacritics
    '''
    def _normalize_cleaned_answer(self, cleaned_answer: str) -> str:
        # NFD decomposes chars into base + diacritic/accent.
        # Unlike NFKD, chars like ﬁ remain unchanged.
        normalized = normalize("NFD", cleaned_answer)
        stripped = "".join(
            c for c in normalized
            if not combining(c)
        ) # removes diacritics
        
        return stripped.upper()

    def clean(self):
        self.question = self.question.strip()
        self.display_answer = self._clean_answer(self.display_answer) 
        self.normalized_answer = self._normalize_cleaned_answer(self.display_answer)

        if len(self.display_answer) != len(self.normalized_answer):
            raise ValidationError(
                {"display_answer": "length mismatch with normalized answer."}
            )

    def save(self, *args, **kwargs):
        self.full_clean() # answer check
        super().save(*args, **kwargs)

'''
Mapping between Board and Clue. Creates ClueCells.
'''
class CluePlacement(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name="clue_placements")
    clue = models.ForeignKey(Clue, on_delete=models.CASCADE)
    start_row = models.PositiveIntegerField()
    start_col = models.PositiveIntegerField()

    direction = models.CharField(
        max_length=1,
        choices=[
            ("A", "Across"),
            ("D", "Down"),
        ]
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["board", "start_row", "start_col", "direction"],
                name="clue_placement_unique_row_col_direction"),
            models.UniqueConstraint(
                fields=["board", "clue"],
                name="clue_placement_unique_board_clue"
            )
        ]

    def _bounds_check(self):
        if self.start_col >= self.board.cols:
            raise ValidationError(
                {"start_col": f"col {self.start_col} exceeds board width {self.board.cols}."}
            )

        if self.start_row >= self.board.rows:
            raise ValidationError(
                {"start_row": f"row {self.start_row} exceeds board height {self.board.rows}."}
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
        self._bounds_check()
        self._across_direction_check()
        self._down_direction_check()

    def _create_cells(self):
        cells = []
        for i in range(len(self.clue.normalized_answer)):
            if self.direction == 'A':
                row = self.start_row
                col = self.start_col + i
                index = i
            else:
                row = self.start_row + i
                col = self.start_col
                index = i

            letter = self.clue.normalized_answer[i]
            
            cell = ClueCell(
                clue_placement=self,
                row_index=row,
                col_index=col,
                placement_index = index,
                letter=letter
            )
            cells.append(cell)
        
        return cells

    def _fetch_overlapping_cells(self):
        qs = (ClueCell.objects
                .select_related("clue_placement")
                .filter(clue_placement__board=self.board) # get all cells of current board
            )

        is_update = self.pk is not None
        if is_update:
            qs = qs.exclude(clue_placement=self) # excludes previous clue placement cells

        length = len(self.clue.normalized_answer)

        if self.direction == 'A':
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
            (c.row_index, c.col_index): c
            for c in overlapping_cells
        }
        
        for cell in new_cells:
            coord = (cell.row_index, cell.col_index)
            overlapping = overlapping_by_coord.get(coord)
            if not overlapping:
                continue
            
            # Rule 1: Cannot overlap same direction
            if overlapping.clue_placement.direction == self.direction:
                raise ValidationError(
                    f"Overlapping clues cannot share direction: '{self.direction}'."
                )

            # Rule 2: Letters must match
            if overlapping.letter != cell.letter:
                raise ValidationError(
                    f"letter conflict at coord ({cell.row_index},{cell.col_index}); '{cell.letter}' != '{overlapping.letter}'."
                )

    def _delete_previous_clue_cells(self):
        is_update = self.pk is not None
        if is_update: # delete previous placement cells
            self.cluecell_set.all().delete()

    def save(self, *args, **kwargs):
        self.full_clean() # bound checks

        new_cells = self._create_cells()
        overlapping_cells = self._fetch_overlapping_cells()
        self._validate_cells(new_cells, overlapping_cells)
        
        with transaction.atomic(): # transactions automatically rollback in case of error
            self._delete_previous_clue_cells()
            
            super().save(*args, **kwargs) # must save placement before creating cells
            ClueCell.objects.bulk_create(new_cells) # create new placement cells

        self.board.updated_at = timezone.now()
        self.board.save(update_fields=['updated_at'])


'''
Created through CluePlacement. Write-only materialized projection.
'''
class ClueCell(models.Model):
    clue_placement = models.ForeignKey(CluePlacement, on_delete=models.CASCADE, related_name="clue_cells")
    row_index = models.PositiveIntegerField()
    col_index = models.PositiveIntegerField()
    placement_index = models.PositiveIntegerField()
    letter = models.CharField(max_length=1)

    class Meta:
        ordering = ["placement_index"]
        constraints = [
            models.UniqueConstraint(
                fields=["clue_placement", "row_index", "col_index"],
                name='clue_cell_unique_placement_row_col'
            ),
            models.UniqueConstraint(
                fields=["clue_placement", "placement_index"],
                name='clue_cell_unique_placement_placement_index'
            )
        ]
        indexes = [
            models.Index(fields=["row_index", "col_index"],
                         name="cluecell_row_col_idx")
        ]

    # CluePlacement calls bulk_create which bypasses save()
    def save(self, *args, **kwargs):
        raise ValueError("ClueCell is a projection and cannot be saved directly.")
