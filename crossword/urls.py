from django.urls import path
from . import views
from .puzzle_list_view import PuzzleListView
from .latest_puzzle_feed import LatestPuzzlesFeed

urlpatterns = [
    path("", PuzzleListView.as_view(), name="index"),
    path("puzzle/<int:id>", views.puzzle, name="puzzle"),
    path("rss/", LatestPuzzlesFeed(), name="rss_feed"),
]