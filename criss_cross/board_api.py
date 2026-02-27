from .models import Board, CluePlacement, ClueCell
from django.db.models import Prefetch
from dataclasses import dataclass, field, asdict
from datetime import datetime
from django.db.models.query import QuerySet
from enum import StrEnum
from json import dumps
from django.core.serializers.json import DjangoJSONEncoder

class Direction(StrEnum):
    A = 'A'
    D = 'D'

class DTO:
    def to_dict(self) -> dict:
        return asdict(self)

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
    board: dict
    placements: dict
    cells: list[dict]
    clues: list[dict]

def get_board(board_id: int):
    board = _fetch_board(board_id)
    placements_qs = board.clue_placements.all()

    serialized_board = _serialize_board(board)
    serialized_placements = _serialize_placements(placements_qs)
    serialized_cells = _serialize_cells(placements_qs)
    serialized_clues = _serialize_clues(placements_qs)

    return _create_http_response_body(serialized_board, serialized_placements, serialized_cells, serialized_clues)

def _create_http_response_body(serialized_board, serialized_placements, serialized_cells, serialized_clues):
    body = {"board": serialized_board,
            "placements": serialized_placements,
            "cells": serialized_cells,
            "clues": serialized_clues
            }

    return dumps(body, cls=DjangoJSONEncoder)

def _map_to_board_dto(board: Board):
    categories = [category.name for category in board.categories.all()]
    return BoardDTO(board.title,
            board.rows,
            board.cols,
            categories,
            board.created_at,
            board.updated_at
        )

def _map_to_placement_dto(placement: CluePlacement):
    clue = placement.clue

    return PlacementDTO(placement.id,
            Direction(placement.direction),
            placement.start_row,
            placement.start_col,
            len(clue.answer),
            clue.answer
        )

def _map_to_cell_dto(c: ClueCell):
    return CellDTO(c.row_index, c.col_index, c.letter)

def _map_to_clue_dto(placement: CluePlacement):
    clue = placement.clue
    direction = Direction(placement.direction)

    return ClueDTO(clue.question, clue.answer, placement.id, direction)

def _serialize_board(board: Board):
    return _map_to_board_dto(board).to_dict()

def _serialize_placements(placements: QuerySet[CluePlacement]):
    p_map = {}
    for placement in placements:
        p_map[placement.id] = _map_to_placement_dto(placement).to_dict()
    
    return p_map

def _serialize_cells(placements: QuerySet[CluePlacement]):
    c_map = {} # cells can have multiple placements along different directions
    
    for placement in placements:
        direction = Direction(placement.direction)

        for c in placement.clue_cells.all():
            key = (c.row_index, c.col_index)

            if key not in c_map:
                c_map[key] = _map_to_cell_dto(c)
            
            c_map[key].placements[direction] = placement.id

    return [cell.to_dict() for cell in c_map.values()]

def _serialize_clues(placements: QuerySet[CluePlacement]):
    clues = []
    for placement in placements:
        clues.append(_map_to_clue_dto(placement).to_dict())

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


          