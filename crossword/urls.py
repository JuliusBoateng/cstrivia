from django.urls import path
from django.views.generic import TemplateView
from django.views.generic.base import RedirectView

from .views.design import DesignNoteListView, design_note_view
from .views.puzzle import PuzzleListView, privacy_view, puzzle_view
from .views.rss import LatestActivityFeed

urlpatterns = [
    path("", PuzzleListView.as_view(), name="index"),
    path("puzzle/<int:puzzle_number>/", puzzle_view, name="puzzle"),
    path("privacy/", privacy_view, name="privacy"),
    path("rss.xml", LatestActivityFeed(), name="rss"),
    path("rss/", RedirectView.as_view(url="/rss.xml", permanent=True)),
    path("design/", DesignNoteListView.as_view(), name="design_index"),
    path("design/<int:design_number>/", design_note_view, name="design_note"),
    path("robots.txt", TemplateView.as_view(template_name="crossword/robots.txt", content_type="text/plain"), name="robots_txt")
]
