from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("crossword/", views.crossword, name="crossword")
]