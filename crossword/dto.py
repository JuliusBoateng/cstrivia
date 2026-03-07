from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum

'''
Purpose of DTO objects is to decouple data from the underlying Django models. Separation of concerns.
'''

class Direction(StrEnum):
    A = 'A'
    D = 'D'

class DTO:
    pass

@dataclass
class BoardDTO(DTO):
    id: int
    title: str
    description: str
    rows: int
    cols: int
    categories: list
    created_at: datetime
    updated_at: datetime

@dataclass
class PlacementDTO(DTO):
    id: int # integral as other DTOs are dependent 
    direction: Direction
    start_row: int
    start_col: int
    length: int

@dataclass
class CellDTO(DTO):
    row: int
    col: int
    letter: str

    # Direction : placement_id
    placements: dict = field(default_factory=lambda: {
        Direction.A: None,
        Direction.D: None
    })

@dataclass
class ClueDTO(DTO):
    question: str
    placement_id: int
    direction: Direction

@dataclass
class SolutionDTO(DTO):
    placement_id: int
    display_answer: str
    normalized_answer: str

@dataclass
class LetterDTO:
    row: int
    col: int
    letter: str

@dataclass
class BoardViewDTO(DTO):
    board: BoardDTO
    placements: list[PlacementDTO]
    cells: list[CellDTO]
    clues: list[ClueDTO]

@dataclass
class SolutionViewDTO(DTO):
    board_id: int
    solutions: list[SolutionDTO]
    letters: list[LetterDTO]
