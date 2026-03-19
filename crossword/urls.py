from django.urls import path
from . import views
from .views import PuzzleListView

urlpatterns = [
    path("", PuzzleListView.as_view(), name="index"),
    path("puzzle/<int:id>", views.puzzle, name="puzzle")
]