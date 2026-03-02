from .dto import BoardDTO, BoardViewDTO, CellDTO, ClueDTO, PlacementDTO, SolutionDTO

'''
Purpose of custom serializer is to control which fields are sent to the FE
'''
def serialize_board_view(dto: BoardViewDTO) -> dict:
    return {
        "board": _serialize_board(dto.board),
        "placements": _serialize_placements(dto.placements),
        "cells": [_serialize_cell(c) for c in dto.cells],
        "clues": [_serialize_clue(c) for c in dto.clues],
        "solutions": _serialize_solutions(dto.solutions),
    }

def _serialize_board(b: BoardDTO) -> dict:
    return {
        "title": b.title,
        "rows": b.rows,
        "cols": b.cols,
        "categories": b.categories,
        "created_at": b.created_at.isoformat(),
        "updated_at": b.updated_at.isoformat(),
    }

# Converts list to map for efficient FE lookup
def _serialize_solutions(solutions: list[SolutionDTO]):
    return {s.placement_id: _serialize_solution(s) for s in solutions}

 # Converts list to map for efficient FE lookup
def _serialize_placements(placements: list[PlacementDTO]):
    return {p.id: _serialize_placement(p) for p in placements}

def _serialize_placement(p: PlacementDTO) -> dict:
    return {
        "id": p.id,
        "direction": p.direction.value, # Converts Direction enum to str
        "start_row": p.start_row,
        "start_col": p.start_col,
        "length": p.length,
    }

def _serialize_solution(solution: SolutionDTO) -> dict:
    return {
        "placement_id": solution.placement_id,
        "display_answer": solution.display_answer,
        "normalized_answer": solution.normalized_answer
    }

def _serialize_clue(c: ClueDTO) -> dict:
    return {
        "question": c.question,
        "placement_id": c.placement_id,
        "direction": c.direction.value,
    }

def _serialize_cell(c: CellDTO) -> dict:
    return {
        "row": c.row,
        "col": c.col,
        "letter": c.letter,
        "placements": {k.value: v for k, v in c.placements.items()}, # Convert Direction enum to str
    }
