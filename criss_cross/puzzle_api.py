from .models import Board, CluePlacement
from django.db.models import Prefetch
from dataclasses import dataclass, field
from datetime import datetime
from django.db.models.query import QuerySet
from enum import StrEnum

@dataclass
class BoardDTO:
    title: str
    rows: int
    cols: int
    categories: list
    created_at: datetime
    updated_at: datetime

class Direction(StrEnum):
    A = 'A'
    D = 'D'

@dataclass
class PlacementDTO:
    id: int
    direction: Direction
    start_row: int
    start_col: int
    length: int
    answer: str

@dataclass
class CellDTO:
    row: int
    col: int
    letter: str
    placements: dict = field(default_factory=lambda: {Direction.A: None, Direction.D: None})

@dataclass
class QuestionDTO:
    question: str
    placement_id: str
    direction: Direction


def _map_board_to_dto(board: Board):
    categories = [category.name for category in board.categories.all()]
    return BoardDTO(board.title,
            board.rows,
            board.cols,
            categories,
            board.created_at,
            board.updated_at
        )

def _map_placements_to_dto(placements: QuerySet[CluePlacement]):
    p_map = {}
    for placement in placements:
        placement_id = placement.id
        clue = placement.clue
        
        p = PlacementDTO(placement_id,
                Direction(placement.direction),
                placement.start_row,
                placement.start_col,
                len(clue.answer),
                clue.answer
            )

        p_map[placement_id] = p
    
    return p_map

def _map_cells_to_dto(placements: QuerySet[CluePlacement]):
    c_map = {} # cells can have multiple placements along different directions
    
    for placement in placements:
        direction = Direction(placement.direction)

        for c in placement.clue_cells.all():
            key = (c.row_index, c.col_index)

            if key not in c_map:
                c_map[key] = CellDTO(c.row_index, c.col_index, c.letter)
            
            c_map[key].placements[direction] = placement.id
    
    return list(c_map.values())

def _fetch_board(board_id: int):
    clue_placement_lookup = Prefetch("clue_placements",
                                    queryset=CluePlacement.objects
                                        .select_related("clue")
                                        .prefetch_related("clue_cells")
                                    )

    board = (Board.objects
                .prefetch_related("categories", clue_placement_lookup)
                .get(id=board_id)
            )
    
    return board

def get_board(board_id: int):
    board = _fetch_board(board_id)
    
    print(_map_board_to_dto(board))
    placements = board.clue_placements.all()
    print(_map_placements_to_dto(placements))
    print(_map_cells_to_dto(placements))
