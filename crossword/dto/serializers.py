from .dto_classes import BoardDTO, BoardViewDTO, CellDTO, ClueDTO, PlacementDTO, LetterDTO, SolutionDTO, SolutionViewDTO, PlacementPositionDTO

'''
Purpose of custom serializer is to control which fields are sent to the FE
'''
def serialize_board_view(dto: BoardViewDTO) -> dict:
    return {
        "board": _serialize_board(dto.board),
        "placements": [_serialize_placement(p) for p in dto.placements],
        "cells": [_serialize_cell(c) for c in dto.cells],
        "clues": [_serialize_clue(c) for c in dto.clues]
    }

def serialize_solution_view(dto: SolutionViewDTO) -> dict:
    return {
        "board_id": dto.board_id,
        "solutions": [_serialize_solution(s) for s in dto.solutions],
        "letters": [_serialize_letter(l) for l in dto.letters]
    }

def _serialize_board(b: BoardDTO) -> dict:
    return {
        "id": b.id,
        "title": b.title,
        "description": b.description,
        "rows": b.rows,
        "cols": b.cols,
        "categories": b.categories,
        "created_at": b.created_at.isoformat(),
        "updated_at": b.updated_at.isoformat(),
    }

def _serialize_placement(p: PlacementDTO) -> dict:
    return {
        "id": p.id,
        "direction": p.direction.value, # Converts Direction enum to str
        "start_row": p.start_row,
        "start_col": p.start_col,
        "length": p.length,
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
        "placement_positions": {k.value: _serialize_placement_position(v) for k, v in c.placement_positions.items()}
    }

def _serialize_letter(letter: LetterDTO) -> dict:
    return {
        "row": letter.row,
        "col": letter.col,
        "letter": letter.letter
    }

def _serialize_placement_position(p: PlacementPositionDTO) -> dict:
    return {
        "placement_id": p.placement_id,
        "placement_index": p.placement_index
    }

def _serialize_solution(solution: SolutionDTO) -> dict:
    return {
        "placement_id": solution.placement_id,
        "display_answer": solution.display_answer,
        "normalized_answer": solution.normalized_answer
    }
