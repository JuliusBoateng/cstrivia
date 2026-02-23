from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.validators import MaxValueValidator, MinValueValidator

class Category(models.Model):
    name = models.CharField(max_length=16, unique=True)

    class Meta:
        ordering = ["name"]

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
    categories = models.ManyToManyField(Category, related_name="Boards")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) # also updates when saving CluePlacement
    
    def clean(self):
        if self.rows != self.cols:
            raise ValidationError(
                {"rows:" f"rows {self.rows} and cols {self.cols} must match."}
            )
        
    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(cols=models.F("rows")),
                name="board_symmetry"
            )
        ]

'''
Questions/Answers for puzzles
'''
class Clue(models.Model):
    question = models.CharField(max_length=150)
    answer = models.CharField(max_length=21)
    answer_length = models.PositiveIntegerField() # derived
    categories = models.ManyToManyField(Category, related_name="Clues")

    def clean(self):
        self.answer = self.answer.upper()

        if not self.answer.isalnum():
            raise ValidationError(
                {"answer": "Must only contain letters and numbers."}
            )

    def save(self, *args, **kwargs):
        self.answer_length = len(self.answer)
        super().save(*args, **kwargs)

'''
Mapping between Board and Clue
'''
class CluePlacement(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE)
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
            col = self.start_col + self.clue.answer_length
            
            if col > self.board.cols:
                raise ValidationError(
                    {"start_col": f"col {col} exceeds board width {self.board.cols}."}
                )
    
    def _down_direction_check(self):
        if self.direction == "D":
            row = self.start_row + self.clue.answer_length

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
        for i in range(self.clue.answer_length):
            if self.direction == 'A':
                row = self.start_row
                col = self.start_col + i
            else:
                row = self.start_row + i
                col = self.start_col

            letter = self.clue.answer[i]
            
            cell = ClueCell(
                clue_placement=self,
                row_index=row,
                col_index=col,
                letter=letter
            )
            cells.append(cell)
        
        return cells

    def _fetch_overlapping_cells(self):
        qs = (ClueCell.objects
                .select_related("clue_placement")
                .filter(clue_placement__board=self.board) # get all cells of current board
                .exclude(clue_placement=self) # excludes previous placement cells
            )

        length = self.clue.answer_length

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

    def validate_cells(self, new_cells, overlapping_cells):
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
                    f"Letter conflict at coords: '({cell.row_index}, {cell.col_index})'; '{cell.letter}' != '{overlapping.letter}'."
                )

    def save(self, *args, **kwargs):
        with transaction.atomic():
            super().save(*args, **kwargs)
            new_cells = self._create_cells()
            overlapping_cells = self._fetch_overlapping_cells()
            self.validate_cells(new_cells, overlapping_cells)
            
            # regenerate cells
            self.cluecell_set.all().delete() # delete previous placement cells
            ClueCell.objects.bulk_create(new_cells) # create new placement cells

        self.board.updated_at = timezone.now()
        self.board.save(update_fields=['updated_at'])


'''
Mapping between CluePlacement and Board cells
'''
class ClueCell(models.Model):
    clue_placement = models.ForeignKey(CluePlacement, on_delete=models.CASCADE)
    row_index = models.PositiveIntegerField()
    col_index = models.PositiveIntegerField()
    letter = models.CharField(max_length=1)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["clue_placement", "row_index", "col_index"],
                name='clue_cell_unique_placement_row_col'
            )
        ]

    def _bounds_check(self):
        board = self.clue_placement.board

        if self.col_index >= board.cols:
            raise ValidationError(
                {"col_index": f"col {self.col_index} exceeds board width {board.cols}."}
            )

        if self.row_index >= board.rows:
            raise ValidationError(
                {"row_index": f"row {self.row_index} exceeds board height {board.rows}."}
            )

    def _across_direction_check(self):
        placement = self.clue_placement
        clue = placement.clue

        if placement.direction == "A":
            if self.row_index != placement.start_row:
                raise ValidationError(
                    {"row_index": f"row {self.row_index} does not match placement start_row {placement.start_row}."}
                )
            
            index = self.col_index - placement.start_col          
            if index >= clue.answer_length:
                raise ValidationError(
                    {"col_index": f"cell {index} extends beyond clue length."}
                )
            
            if clue.answer[index] != self.letter:
                raise ValidationError(
                    {"letter": f"letter mismatch at index {index}: expected '{clue.answer[index]}', got '{self.letter}'."}
                )

    def _down_direction_check(self):
        placement = self.clue_placement
        clue = placement.clue

        if placement.direction == "D":
            if self.col_index != placement.start_col:
                raise ValidationError(
                    {"col_index": f"col {self.col_index} does not match placement start_col {placement.start_col}."}
                )
            
            index = self.row_index - placement.start_row  
            if index >= clue.answer_length:
                raise ValidationError(
                    {"row_index": f"cell {index} extends beyond clue length."}
                )
            
            if clue.answer[index] != self.letter:
                raise ValidationError(
                    {"letter": f"letter mismatch at index {index}: expected '{clue.answer[index]}', got '{self.letter}'."}
                )

    def clean(self):
        self._bounds_check()
        self._across_direction_check()
        self._down_direction_check()
