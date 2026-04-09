from django.urls import path

from . import views
from .design_list_view import DesignNoteListView
from .latest_activity_feed import LatestActivityFeed
from .puzzle_list_view import PuzzleListView

urlpatterns = [
    path("", PuzzleListView.as_view(), name="index"),
    path("puzzle/<int:puzzle_number>", views.puzzle, name="puzzle"),
    path("privacy/", views.privacy, name="privacy"),
    path("rss/", LatestActivityFeed(), name="rss_feed"),
    path("design/", DesignNoteListView.as_view(), name="design_index"),
    path("design/<int:design_number>/", views.design, name="design")
]