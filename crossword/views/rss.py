from itertools import chain

from django.contrib.syndication.views import Feed
from django.utils import timezone

from ..models import Board, DesignNote

RSS_LIMIT = 20

class LatestActivityFeed(Feed):
    content_type = "application/rss+xml; charset=utf-8"

    title = "CS Trivia"
    link = "/"
    description = "New computer science crosswords and design notes"

    def items(self):
        puzzles = Board.objects.filter(
            published_at__lte=timezone.now()
        ).order_by("-published_at")[:RSS_LIMIT]

        design_notes = DesignNote.objects.filter(
            published_at__lte=timezone.now()
        ).order_by("-published_at")[:RSS_LIMIT]

        items = sorted(
            chain(puzzles, design_notes),
            key=lambda item: item.published_at,
            reverse=True,
        )

        return items[:RSS_LIMIT]

    def item_title(self, item):
        if isinstance(item, Board):
            return f"Puzzle {item.puzzle_number}: {item.title}"
        return f"Design #{item.design_number}: {item.title}"

    def item_description(self, item):
        if isinstance(item, Board):
            return item.description or ""
        return ""

    def item_link(self, item):
        return item.get_absolute_url()

    def item_pubdate(self, item):
        return item.published_at

    def item_categories(self, item):
        if isinstance(item, Board):
            return ["Puzzle"]
        return ["Design Note"]
