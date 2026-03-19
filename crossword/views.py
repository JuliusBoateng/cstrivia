from django.shortcuts import render
from .service import get_puzzle_views
from django.views.generic import ListView
from .models import Board
from django.utils import timezone

PAGINATION_LIMIT = 10

# Create your views here.
class PuzzleListView(ListView):
    model = Board
    template_name = "crossword/index.html"
    context_object_name = "puzzles"
    paginate_by = PAGINATION_LIMIT

    def get_queryset(self):
        return Board.objects.order_by("-published_at").filter(published_at__lte=timezone.now())


def puzzle(request, id: int):
    views = get_puzzle_views(id)
    data = {"board_view_dto": views.serialized_board_view,
            "solution_view_dto": views.serialized_solution_view}
    return render(request, "crossword/puzzle.html", data)
