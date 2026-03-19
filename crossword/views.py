from django.shortcuts import render

from .service import get_views

# Create your views here.
def index(request):
    return render(request, "crossword/index.html")

def crossword(request):
    print("hmmm")
    views = get_views(3)
    data = {"board_view_dto": views.serialized_board_view,
            "solution_view_dto": views.serialized_solution_view}
    return render(request, "crossword/crossword.html", data)
