from typing import NamedTuple

from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone

from ..dto.mappers import (
    SeoDTO,
    map_to_board_view_dto,
    map_to_seo_dto,
    map_to_solution_view_dto,
)
from ..dto.serializers import serialize_board_view, serialize_solution_view
from ..models import Board, CluePlacement, DesignNote


class PuzzleView(NamedTuple):
    seo: SeoDTO
    serialized_board_view: dict
    serialized_solution_view: dict
    design_note: DesignNote
    next_puzzle: Board

def get_puzzle_view(puzzle_number: int) -> PuzzleView:
    board: Board = _fetch_board(puzzle_number)
    next_puzzle: Board =_fetch_next_board(puzzle_number)

    board_view = map_to_board_view_dto(board)
    serialized_board_view = serialize_board_view(board_view)
    
    solution_view = map_to_solution_view_dto(board)
    serialized_solution_view = serialize_solution_view(solution_view)

    seo = map_to_seo_dto(board) # not serialized b/c used directly for django templates

    design_note = board.design_notes.order_by("design_number").first()
    return PuzzleView(seo, serialized_board_view, serialized_solution_view, design_note, next_puzzle)

def _fetch_board(puzzle_number: int) -> Board:
    queryset = (Board.objects
                .prefetch_related(
                    "categories",
                    "design_notes",
                    Prefetch("clue_placements",
                        queryset=CluePlacement.objects
                            .select_related("clue")
                            .prefetch_related("clue_cells")
                    ))
                .filter(published_at__lte=timezone.now())
                )
    
    return get_object_or_404(queryset, puzzle_number=puzzle_number)

def _fetch_next_board(puzzle_number: int):
    return (    
        Board.objects
        .filter(
            puzzle_number__gt=puzzle_number,
            published_at__lte=timezone.now(),
        )
        .order_by("puzzle_number")
        .first()
    )

def get_design_note(design_number: int) -> DesignNote:
    return get_object_or_404(
        DesignNote.objects.prefetch_related("boards", "categories"),
        design_number=design_number,
        published_at__lte=timezone.now(),
    )
