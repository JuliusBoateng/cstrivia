from typing import NamedTuple

from django.db.models import Model, Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .dto.mappers import (
    SeoDTO,
    map_to_board_view_dto,
    map_to_seo_dto,
    map_to_solution_view_dto,
)
from .dto.serializers import serialize_board_view, serialize_solution_view
from .models import Board, CluePlacement, DesignNote


class Views(NamedTuple):
    seo: SeoDTO
    serialized_board_view: dict
    serialized_solution_view: dict

def get_puzzle_views(puzzle_number: int) -> Views:
    board: Model = _fetch_board(puzzle_number)

    board_view = map_to_board_view_dto(board)
    serialized_board_view = serialize_board_view(board_view)
    
    solution_view = map_to_solution_view_dto(board)
    serialized_solution_view = serialize_solution_view(solution_view)

    seo = map_to_seo_dto(board) # not serialized b/c used directly for django templates

    return Views(seo, serialized_board_view, serialized_solution_view)

def _fetch_board(puzzle_number: int) -> Board:
    queryset = (Board.objects
                .prefetch_related("categories",
                    Prefetch("clue_placements",
                        queryset=CluePlacement.objects
                            .select_related("clue")
                            .prefetch_related("clue_cells")
                    ))
                .filter(published_at__lte=timezone.now())
                )
    
    return get_object_or_404(queryset, puzzle_number=puzzle_number)

def get_design_views(design_number: int) -> DesignNote:
    return get_object_or_404(
        DesignNote.objects.prefetch_related("boards", "categories"),
        design_number=design_number,
        published_at__lte=timezone.now(),
    )
