from django.shortcuts import render
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.generic import ListView

from ..models import Board
from ..api.service import get_puzzle_view, PuzzleView

PAGINATION_LIMIT = 10

@method_decorator(never_cache, name="dispatch")
class PuzzleListView(ListView):
    model = Board
    template_name = "crossword/index.html"
    context_object_name = "puzzles"
    paginate_by = PAGINATION_LIMIT

    def get_queryset(self):
        return (
            Board.objects
            .filter(published_at__lte=timezone.now())
            .order_by("-puzzle_number")
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        puzzles = context.get("puzzles")  # this is your page object
        context["latest_puzzle"] = puzzles[0] if puzzles else None

        return context

@never_cache
def puzzle_view(request, puzzle_number: int):
    views: PuzzleView = get_puzzle_view(puzzle_number)
    data = {
        "seo": views.seo,
        "board_view_dto": views.serialized_board_view,
        "solution_view_dto": views.serialized_solution_view,
        "design_note": views.design_note,
        "next_puzzle": views.next_puzzle
    }
    return render(request, "crossword/puzzle.html", data)

def privacy_view(request):
    return render(request, "crossword/privacy.html")
