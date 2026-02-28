from django.shortcuts import render
from django.http import JsonResponse
from .board_api import build_board_response_dto
from django.core.serializers.json import DjangoJSONEncoder
from dataclasses import asdict
from json import dumps

# Create your views here.
def index(request):
    board_response_dto = build_board_response_dto(1)
    data = {"board_data": board_response_dto.to_dict()}
    response = JsonResponse(data, encoder=DjangoJSONEncoder)
    print(response.content)
    return render(request, "criss_cross/index.html", data)