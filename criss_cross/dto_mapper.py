from django.db.models.query import QuerySet

from .dto import (
    BoardDTO,
    BoardViewDTO,
    CellDTO,
    ClueDTO,
    Direction,
    PlacementDTO,
    SolutionDTO,
)
from .models import Board, ClueCell, CluePlacement

'''
Purpose of mappers is to provide a way to transform Django models into their respective data objects.
'''

def map_to_board_view_dto(board: Board, placements_qs: QuerySet) -> BoardViewDTO:
    board_dto: BoardDTO = _map_to_board_dto(board)
    placements: list[PlacementDTO] = _map_to_placement_dtos(placements_qs)
    cells: list[CellDTO] = _map_to_cell_dtos(placements_qs)
    clues: list[ClueDTO] = _map_to_clue_dtos(placements_qs)
    solutions: list[SolutionDTO] = _map_to_solution_dtos(placements_qs)

    return BoardViewDTO(board_dto, placements, cells, clues, solutions)


def _map_to_board_dto(board: Board) -> BoardDTO:
    categories = [category.name for category in board.categories.all()] # categories prefetch prevents N+1 query
    return BoardDTO(board.title,
            board.description,
            board.rows,
            board.cols,
            categories,
            board.created_at,
            board.updated_at
        )

def _map_to_solution_dtos(placements: QuerySet[CluePlacement]) -> list[SolutionDTO]:
    solutions = []
    for placement in placements:
        solutions.append(_map_to_solution_dto(placement))
    
    return solutions

def _map_to_placement_dtos(placements: QuerySet[CluePlacement]) -> list[PlacementDTO]:
    p = []
    for placement in placements:
        p.append(_map_to_placement_dto(placement))
    
    return p

def _map_to_cell_dtos(placements: QuerySet[CluePlacement]) -> list[CellDTO]:
    c_map = {} # cells can have multiple placements along different directions
    
    for placement in placements:
        direction = Direction(placement.direction)

        for c in placement.clue_cells.all(): # clue_cells prefetch prevents N+1 query
            key = (c.row_index, c.col_index)

            if key not in c_map:
                c_map[key] = _map_to_cell_dto(c)
            
            c_map[key].placements[direction] = placement.id

    return list(c_map.values())

def _map_to_clue_dtos(placements: QuerySet[CluePlacement]) -> list[ClueDTO]:
    clues = []
    for placement in placements:
        clues.append(_map_to_clue_dto(placement))

    return clues

def _map_to_placement_dto(placement: CluePlacement) -> PlacementDTO:
    return PlacementDTO(placement.id,
            Direction(placement.direction),
            placement.start_row,
            placement.start_col,
            len(placement.clue.normalized_answer),
        )

def _map_to_cell_dto(c: ClueCell) -> CellDTO:
    return CellDTO(c.row_index, c.col_index, c.letter)

def _map_to_clue_dto(placement: CluePlacement) -> ClueDTO:
    return ClueDTO(placement.clue.question, placement.id, Direction(placement.direction))

def _map_to_solution_dto(placement: CluePlacement) -> SolutionDTO:
    return SolutionDTO(placement.id, placement.clue.display_answer, placement.clue.normalized_answer)
