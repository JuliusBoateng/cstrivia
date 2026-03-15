import {BoardView} from "./models/boardView.js";
import {SolutionView} from "./models/solutionView.js";

const BOARD = "board";
const BOARD_VIEW_DTO = "board-view-dto";
const SOLUTION_VIEW_DTO = "solution-view-dto";
const CLUES = "clues";

function getTableElement(): HTMLTableElement {
    const tableElement = document.getElementById(BOARD);

    if (!(tableElement instanceof HTMLTableElement) || !tableElement) {
        throw Error("Table is not available");
    }

    return tableElement;
}

function getBoardView(): BoardView {
    const boardViewDTOElement = document.getElementById(BOARD_VIEW_DTO);
    if (!boardViewDTOElement?.textContent) {
        throw Error("BoardViewDTO missing content");
    }

    const boardViewDTO = JSON.parse(boardViewDTOElement.textContent);
    return BoardView.fromDTO(boardViewDTO)
}

function getSolutionView(): SolutionView {
    const solutionViewDTOElement = document.getElementById(SOLUTION_VIEW_DTO);
    if (!solutionViewDTOElement?.textContent) {
        throw Error("SolutionViewDTO missing content");
    }

    const solutionViewDTO = JSON.parse(solutionViewDTOElement.textContent);
    return SolutionView.fromDTO(solutionViewDTO)
}


function getClueContainer(): HTMLDivElement {
    const clueContainer = document.getElementById(CLUES);

    if (!(clueContainer instanceof HTMLDivElement) || !clueContainer) {
        throw Error("Clue dom is not available");
    }

    return clueContainer;
}

export {getTableElement, getBoardView, getSolutionView, getClueContainer};