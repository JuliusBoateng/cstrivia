from urllib.parse import urlparse

from django.shortcuts import render
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.generic import ListView

from ..api.service import PuzzleView, get_puzzle_view
from ..models import Board

PAGINATION_LIMIT = 10


@method_decorator(never_cache, name="dispatch")
class PuzzleListView(ListView):
    model = Board
    template_name = "crossword/index.html"
    context_object_name = "puzzles"

    def get_queryset(self):
        return Board.objects.filter(published_at__lte=timezone.now()).order_by(
            "-puzzle_number"
        )[:PAGINATION_LIMIT]

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["is_archive"] = False

        puzzles = context.get("puzzles")  # this is your page object
        context["latest_puzzle"] = puzzles[0] if puzzles else None
        return context


@method_decorator(never_cache, name="dispatch")
class PuzzleArchiveView(ListView):
    model = Board
    template_name = "crossword/archive.html"
    context_object_name = "puzzles"
    paginate_by = PAGINATION_LIMIT

    def get_queryset(self):
        return Board.objects.filter(published_at__lte=timezone.now()).order_by(
            "-puzzle_number"
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["is_archive"] = True
        return context


@never_cache
def puzzle_view(request, puzzle_number: int):
    views: PuzzleView = get_puzzle_view(puzzle_number)
    back_href = puzzle_back_href(request)
    data = {
        "board_metadata": views.board_metadata,
        "board_view_dto": views.serialized_board_view,
        "solution_view_dto": views.serialized_solution_view,
        "design_note": views.design_note,
        "next_puzzle": views.next_puzzle,
        "alt_header_href": back_href,
    }
    return render(request, "crossword/puzzle.html", data)


def puzzle_back_href(request):
    referer = request.META.get("HTTP_REFERER", "")

    path = urlparse(referer).path
    if path.endswith("/puzzle/"):
        return "/puzzle/"

    return "/"


def privacy_view(request):
    return render(request, "crossword/privacy.html")


def custom_404(request, exception):
    board = Board.objects.filter(published_at__lte=timezone.now()).order_by(
        "-puzzle_number"
    )[:PAGINATION_LIMIT]
    return render(
        request,
        "crossword/404.html",
        {"puzzles": board, "is_archive": False},
        status=404,
    )
