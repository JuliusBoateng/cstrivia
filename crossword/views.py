from django.shortcuts import render
from django.views.decorators.cache import never_cache

from .service import get_puzzle_views

PAGINATION_LIMIT = 10

# Create your views here.
@never_cache
def puzzle(request, puzzle_number: int):
    views = get_puzzle_views(puzzle_number)
    data = {
        "seo": views.seo,
        "board_view_dto": views.serialized_board_view,
        "solution_view_dto": views.serialized_solution_view
    }
    return render(request, "crossword/puzzle.html", data)
