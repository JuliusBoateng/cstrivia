from django.contrib.sitemaps import Sitemap
from .models import Board
from django.urls import reverse
from django.utils import timezone

class PuzzleSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return Board.objects.filter(published_at__lte=timezone.now())

    def lastmod(self, obj):
        return obj.published_at

class StaticSitemap(Sitemap):
    def items(self):
        return ["index", "privacy"]

    def location(self, item):
        return reverse(item)

    def priority(self, item):
        return 0.8 if item == "index" else 0.3

    def changefreq(self, item):
        return "weekly" if item == "index" else "yearly"