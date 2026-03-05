from django.db.models import Model, Prefetch
from django.db.models.query import QuerySet

from .dto_mapper import map_to_board_view_dto, map_to_solution_view_dto
from .models import Board, CluePlacement
from .dto_serializer import serialize_board_view, serialize_solution_view
from typing import NamedTuple

class views(NamedTuple):
    serialized_board_view: dict
    serialized_solution_view: dict

def get_views(board_id: int) -> views:
    board: Model = _fetch_board(board_id)
    placements_qs: QuerySet = board.clue_placements.all() # clue_placement prefetch prevents N+1 query

    board_view = map_to_board_view_dto(board, placements_qs)
    serialized_board_view = serialize_board_view(board_view)
    
    solution_view = map_to_solution_view_dto(placements_qs)
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
                .get(id=board_id)
            )
    
    return board
