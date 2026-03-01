from .models import Board, CluePlacement
from django.db.models import Prefetch
from django.db.models import Model
from django.db.models.query import QuerySet
from .dto import BoardDTO, BoardResponseDTO, PlacementDTO, ClueDTO, CellDTO, SolutionDTO
from .serializer import serialize_board_response
from .dto_mapper import map_to_board_dto, map_to_placement_dtos, map_to_cell_dtos, map_to_clue_dtos, map_to_solution_dtos

def build_board_response_dto(board_id: int):
    board: Model = _fetch_board(board_id)
    placements_qs: QuerySet = board.clue_placements.all() # clue_placement prefetch prevents N+1 query

    board_dto: BoardDTO = map_to_board_dto(board)
    placements: list[PlacementDTO] = map_to_placement_dtos(placements_qs)
    cells: list[CellDTO] = map_to_cell_dtos(placements_qs)
    clues: list[ClueDTO] = map_to_clue_dtos(placements_qs)
    solutions: list[SolutionDTO] = map_to_solution_dtos(placements_qs)

    board_response = BoardResponseDTO(board_dto, placements, cells, clues, solutions)
    serialized_board = serialize_board_response(board_response)
    return serialized_board

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
