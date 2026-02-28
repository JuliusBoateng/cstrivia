from .models import Board, CluePlacement, ClueCell
from django.db.models import Prefetch
from dataclasses import dataclass, field
from datetime import datetime
from django.db.models.query import QuerySet
from enum import StrEnum

class Direction(StrEnum):
    A = 'A'
    D = 'D'

class DTO:
    pass

@dataclass
class BoardDTO(DTO):
    title: str
    rows: int
    cols: int
    categories: list
    created_at: datetime
    updated_at: datetime

@dataclass
class PlacementDTO(DTO):
    id: int
    direction: Direction
    start_row: int
    start_col: int
    length: int
    answer: str

@dataclass
class CellDTO(DTO):
    row: int
    col: int
    letter: str
    placements: dict = field(default_factory=lambda: {Direction.A: None, Direction.D: None})

@dataclass
class ClueDTO(DTO):
    question: str
    answer: str
    placement_id: str
    direction: Direction

@dataclass
class BoardResponseDTO(DTO):
    board: BoardDTO
    placements: dict[int, PlacementDTO]
    cells: list[CellDTO]
    clues: list[ClueDTO]

def build_board_response_dto(board_id: int):
    board = _fetch_board(board_id)
    placements_qs = board.clue_placements.all()

    board_dto = _map_board_to_board_dto(board)
    placements = _map_placements_to_placement_dto_map(placements_qs)
    cells = _map_placements_to_cell_dtos(placements_qs)
    clues = _map_placements_to_clue_dtos(placements_qs)

    return BoardResponseDTO(board_dto, placements, cells, clues)

def _map_board_to_board_dto(board: Board) -> BoardDTO:
    categories = [category.name for category in board.categories.all()]
    return BoardDTO(board.title,
            board.rows,
            board.cols,
            categories,
            board.created_at,
            board.updated_at
        )

def _map_placement_to_placement_dto(placement: CluePlacement) -> PlacementDTO:
    clue = placement.clue

    return PlacementDTO(placement.id,
            Direction(placement.direction),
            placement.start_row,
            placement.start_col,
            len(clue.answer),
            clue.answer
        )

def _map_cell_to_cell_dto(c: ClueCell) -> CellDTO:
    return CellDTO(c.row_index, c.col_index, c.letter)

def _map_placement_to_clue_dto(placement: CluePlacement) -> CellDTO:
    clue = placement.clue
    direction = Direction(placement.direction)

    return ClueDTO(clue.question, clue.answer, placement.id, direction)

def _map_placements_to_placement_dto_map(placements: QuerySet[CluePlacement]) -> dict[int, PlacementDTO]:
    p_map = {}
    for placement in placements:
        p_map[placement.id] = _map_placement_to_placement_dto(placement)
    
    return p_map

def _map_placements_to_cell_dtos(placements: QuerySet[CluePlacement]) -> list[CellDTO]:
    c_map = {} # cells can have multiple placements along different directions
    
    for placement in placements:
        direction = Direction(placement.direction)

        for c in placement.clue_cells.all():
            key = (c.row_index, c.col_index)

            if key not in c_map:
                c_map[key] = _map_cell_to_cell_dto(c)
            
            c_map[key].placements[direction] = placement.id

    return list(c_map.values())

def _map_placements_to_clue_dtos(placements: QuerySet[CluePlacement]) -> list[ClueDTO]:
    clues = []
    for placement in placements:
        clues.append(_map_placement_to_clue_dto(placement))

    return clues

def _fetch_board(board_id: int) -> Board:
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
