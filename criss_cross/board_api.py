from .models import Board, CluePlacement, ClueCell
from django.db.models import Prefetch
from django.db.models.query import QuerySet
from .dto_classes import BoardDTO, BoardResponseDTO, PlacementDTO, ClueDTO, CellDTO, SolutionDTO
from .dto_mappers import map_to_board_dto, map_to_placement_dtos, map_to_cell_dtos, map_to_clue_dtos, map_to_solution_dtos

# def serialize_board_response(dto: BoardResponseDTO) -> dict:

def build_board_response_dto(board_id: int):
    board = _fetch_board(board_id)
    placements_qs = board.clue_placements.all() # clue_placement prefetch prevents N+1 query

    board_dto: BoardDTO = map_to_board_dto(board)
    placements: list[PlacementDTO] = map_to_placement_dtos(placements_qs)
    cells: list[CellDTO] = map_to_cell_dtos(placements_qs)
    clues: list[ClueDTO] = map_to_clue_dtos(placements_qs)
    solutions: list[SolutionDTO] = map_to_solution_dtos(placements_qs)

    return BoardResponseDTO(board_dto, placements, cells, clues, solutions)

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
