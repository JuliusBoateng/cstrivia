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
    priority = 0.8
    changefreq = "weekly"

    def items(self):
        return ["index"]

    def location(self, item):
        return reverse(item)