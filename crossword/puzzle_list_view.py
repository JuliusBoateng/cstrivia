from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.generic import ListView

from .models import Board

PAGINATION_LIMIT = 10

@method_decorator(never_cache, name="dispatch")
class PuzzleListView(ListView):
    model = Board
    template_name = "crossword/index.html"
    context_object_name = "puzzles"
    paginate_by = PAGINATION_LIMIT

    def get_queryset(self):
        return Board.objects.order_by("-published_at").filter(published_at__lte=timezone.now())

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        puzzles = context.get("puzzles")  # this is your page object
        context["latest_puzzle"] = puzzles[0] if puzzles else None

        return context
