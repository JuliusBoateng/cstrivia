from django.shortcuts import render
from .board_api import get_board

# Create your views here.
def index(request):
    body = get_board(1)
    print(body)
    return render(request, "criss_cross/index.html")