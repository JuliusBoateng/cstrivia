from django.shortcuts import render

from .service import get_board_view

# Create your views here.
def index(request):
    board_response_dto = get_board_view(1)
    data = {"board_view_dto": board_response_dto}
    return render(request, "criss_cross/index.html", data)
