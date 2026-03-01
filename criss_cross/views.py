from django.shortcuts import render

from .service import build_board_response_dto

# Create your views here.
def index(request):
    board_response_dto = build_board_response_dto(1)
    data = {"board_data": board_response_dto}
    print(data)
    return render(request, "criss_cross/index.html", data)
