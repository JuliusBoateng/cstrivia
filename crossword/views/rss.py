import re
from itertools import chain

from django.contrib.syndication.views import Feed
from django.utils import timezone
from django.utils.text import Truncator

from ..models import Board, DesignNote

RSS_LIMIT = 20

def extract_intro(markdown):
    for line in markdown.splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            return line
    return ""

def strip_markdown(text):
     # converts markdown links to plain text
    text = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', text)

    # removes basic formatting like *italic*, **bold**, and `code`
    text = re.sub(r'[*_`]', '', text)

    # collapse whitespace
    text = re.sub(r'\s+', ' ', text)

    return text.strip()


class LatestActivityFeed(Feed):
    content_type = "application/rss+xml; charset=utf-8"
    image_url = "/static/crossword/img/favicon-48.png"

    title = "CS Trivia"
    link = "/"
    description = "New computer science crosswords and design notes"

    def __call__(self, request, *args, **kwargs):
        response = super().__call__(request, *args, **kwargs)
        response["X-Robots-Tag"] = "noindex"
        return response

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
        return f"Design {item.design_number}: {item.title}"

    def item_description(self, item):
        if isinstance(item, Board):
            return item.description or ""

        if isinstance(item, DesignNote):
            intro = extract_intro(item.body)
            intro = strip_markdown(intro)
            return Truncator(intro).words(50)

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
        return ["Design Note"]
