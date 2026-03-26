from django.contrib.sitemaps import Sitemap
from .models import Board
from django.urls import reverse

class PuzzleSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return Board.objects.all()

    def lastmod(self, obj):
        return obj.published_at

class StaticSitemap(Sitemap):
    priority = 1.0
    changefreq = "weekly"

    def items(self):
        return ["index"]

    def location(self, item):
        return reverse(item)