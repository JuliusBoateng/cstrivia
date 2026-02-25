from models import Board

def retrieve_board(board_id: int):
    board = Board.objects.get(board_id=board_id)
    print(board)