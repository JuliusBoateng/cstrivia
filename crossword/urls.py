from django.urls import path

from .views.design import DesignNoteListView, design_note_view
from .views.rss import LatestActivityFeed
from .views.puzzle import PuzzleListView, puzzle_view, privacy_view

urlpatterns = [
    path("", PuzzleListView.as_view(), name="index"),
    path("puzzle/<int:puzzle_number>/", puzzle_view, name="puzzle"),
    path("privacy/", privacy_view, name="privacy"),
    path("rss.xml", LatestActivityFeed(), name="rss"),
    path("design/", DesignNoteListView.as_view(), name="design_index"),
    path("design/<int:design_number>/", design_note_view, name="design_note")
]
