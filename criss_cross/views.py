from django.shortcuts import render
from puzzle import retrieve_board

# Create your views here.
def index(request):
    retrieve_board(1)
    return render(request, "criss_cross/index.html")