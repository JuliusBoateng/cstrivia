from dataclasses import dataclass, field, asdict
from enum import StrEnum
from datetime import datetime
from copy import deepcopy

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
    answer: str

@dataclass
class BoardResponseDTO(DTO):
    board: BoardDTO
    placements: list[PlacementDTO]
    cells: list[CellDTO]
    clues: list[ClueDTO]
    solutions: list[SolutionDTO]

    def _create_solutions_map(self): # Easier FE lookup
        return {s.placement_id: s.answer for s in self.solutions}

    def _create_placements_map(self): # Easier FE lookup
        return { p.id: p for p in self.placements }

    def to_dict(self):
        data = deepcopy(self)
        data.placements = data._create_placements_map()
        data.solutions = data._create_solutions_map()
        data = asdict(data)
        return data
