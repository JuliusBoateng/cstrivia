import {BoardView} from "./models/boardView.js";
import {SolutionView} from "./models/solutionView.js";

function getTableElement(): HTMLTableElement {
    const tableElement = document.getElementById("board");

    if (!(tableElement instanceof HTMLTableElement) || !tableElement) {
        throw Error("Table is not available");
    }

    return tableElement;
}

function getBoardView(): BoardView {
    const boardViewDTOElement = document.getElementById('board-view-dto');
    if (!boardViewDTOElement?.textContent) {
        throw Error("BoardViewDTO missing content");
    }

    const boardViewDTO = JSON.parse(boardViewDTOElement.textContent);
    return BoardView.fromDTO(boardViewDTO)
}

function getSolutionView(): SolutionView {
    const solutionViewDTOElement = document.getElementById('solution-view-dto');
    if (!solutionViewDTOElement?.textContent) {
        throw Error("SolutionViewDTO missing content");
    }

    const solutionViewDTO = JSON.parse(solutionViewDTOElement.textContent);
    return SolutionView.fromDTO(solutionViewDTO)
}

export {getTableElement, getBoardView, getSolutionView};