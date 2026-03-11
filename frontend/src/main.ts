import {getTableElement, getBoardView, getSolutionView} from "./domLoader.js";
import {createBoard, BoardDom} from "./render/boardDomBuilder.js";

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement = getTableElement();
    const boardView = getBoardView();
    const solutionView = getSolutionView();

    if (boardView.board.id != solutionView.board_id) {
        throw Error("SolutionView does not match BoardView")
    }

    const boardDom: BoardDom = createBoard(boardView, tableElement);
});
