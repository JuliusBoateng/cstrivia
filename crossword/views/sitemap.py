from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.utils import timezone

from ..models import Board, DesignNote


class PuzzleSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return Board.objects.filter(published_at__lte=timezone.now())

    def lastmod(self, obj):
        return obj.published_at


class DesignNoteSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        return DesignNote.objects.filter(published_at__lte=timezone.now())

    def lastmod(self, obj):
        return obj.published_at


class StaticSitemap(Sitemap):
    def items(self):
        return ["index", "archive", "design"]

    def location(self, item):
        return reverse(item)

    def priority(self, item):
        if (item == "index") or (item == "archive"):
            return 0.8

        if item == "design":
            return 0.6

    def changefreq(self, item):
        if (item == "index") or (item == "archive") or (item == "design"):
            return "weekly"


def get_sitemap_view():
    return {
        "static": StaticSitemap,
        "puzzles": PuzzleSitemap,
        "design_notes": DesignNoteSitemap,
    }
