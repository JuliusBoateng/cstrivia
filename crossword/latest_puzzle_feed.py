from django.contrib.syndication.views import Feed
from django.urls import reverse
from django.utils import timezone
from .models import Board

class LatestPuzzlesFeed(Feed):
    title = "CS Trivia Puzzles"
    link = "/"
    description = "New computer science crossword puzzles"

    def items(self):
        return Board.objects.filter(
            published_at__lte=timezone.now()
        ).order_by("-published_at")[:20]

    def item_title(self, item):
        return f"Puzzle {item.puzzle_number}: {item.title}"

    def item_description(self, item):
        return item.description

    def item_link(self, item):
        return reverse("puzzle", args=[item.id])

    def item_pubdate(self, item):
        return item.published_at
