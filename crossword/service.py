from django.db.models import Model, Prefetch

from .dto.mappers import map_to_board_view_dto, map_to_solution_view_dto
from .models import Board, CluePlacement
from .dto.serializers import serialize_board_view, serialize_solution_view
from typing import NamedTuple
from django.utils import timezone

class views(NamedTuple):
    serialized_board_view: dict
    serialized_solution_view: dict

def get_puzzle_views(board_id: int) -> views:
    board: Model = _fetch_board(board_id)

    board_view = map_to_board_view_dto(board)
    serialized_board_view = serialize_board_view(board_view)
    
    solution_view = map_to_solution_view_dto(board)
    serialized_solution_view = serialize_solution_view(solution_view)

    return views(serialized_board_view, serialized_solution_view)

def _fetch_board(board_id: int) -> Board:
    board = (Board.objects
                .prefetch_related("categories",
                    Prefetch("clue_placements",
                        queryset=CluePlacement.objects
                            .select_related("clue")
                            .prefetch_related("clue_cells")
                    ))
                .filter(published_at__lte=timezone.now())
                .get(id=board_id)
            )
    
    return board
