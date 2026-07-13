from itertools import chain

from django.contrib.syndication.views import Feed
from django.utils import timezone

from ..models import Board, DesignNote, Exhibit
from .design import build_design_note_description
from .exhibit import build_exhibit_description

RSS_LIMIT = 20


class LatestActivityFeed(Feed):
    content_type = "application/rss+xml; charset=utf-8"
    image_url = "/static/crossword/img/favicon-48.png"

    title = "CS Trivia"
    link = "/"
    description = "New computer science crosswords, design notes, and exhibits"

    def __call__(self, request, *args, **kwargs):
        response = super().__call__(request, *args, **kwargs)
        response["X-Robots-Tag"] = "noindex"
        return response

    def items(self):
        puzzles = Board.objects.filter(published_at__lte=timezone.now()).order_by(
            "-published_at"
        )[:RSS_LIMIT]

        design_notes = DesignNote.objects.filter(
            published_at__lte=timezone.now()
        ).order_by("-published_at")[:RSS_LIMIT]

        exhibits = Exhibit.objects.filter(published_at__lte=timezone.now()).order_by(
            "-published_at"
        )[:RSS_LIMIT]

        items = sorted(
            chain(puzzles, design_notes, exhibits),
            key=lambda item: item.published_at,
            reverse=True,
        )

        return items[:RSS_LIMIT]

    def item_title(self, item):
        if isinstance(item, Board):
            return f"Puzzle {item.puzzle_number}: {item.title}"

        if isinstance(item, DesignNote):
            return f"Design {item.design_number}: {item.title}"

        return f"Exhibit {item.exhibit_number}: {item.title}"

    def item_description(self, item):
        if isinstance(item, Board):
            return item.description or ""

        if isinstance(item, DesignNote):
            return build_design_note_description(item)

        if isinstance(item, Exhibit):
            return build_exhibit_description(item)

        return ""

    def item_link(self, item):
        return item.get_absolute_url()

    def item_guid_is_permalink(self, item):
        return True

    def item_pubdate(self, item):
        return item.published_at

    def item_categories(self, item):
        if isinstance(item, Board):
            return ["Puzzle"]

        if isinstance(item, DesignNote):
            return ["Design Note"]

        return ["Exhibit"]
