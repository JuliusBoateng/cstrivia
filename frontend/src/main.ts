import {BoardView, SolutionView} from "./model.js";
import {createTableBody, createCaption} from "./dom.js";

function getTableElement(): HTMLTableElement {
    const tableElement = document.querySelector("#board") as HTMLTableElement;
    if (!tableElement) {
        throw new Error("Table is not available");
    }

    return tableElement;
}

function getBoardView(): BoardView {
    const boardViewDTOElement = document.getElementById('board-view-dto');
    if (!boardViewDTOElement?.textContent) {
        throw new Error("BoardViewDTO missing content");
    }

    const boardViewDTO = JSON.parse(boardViewDTOElement.textContent);
    return BoardView.fromDTO(boardViewDTO)
}

function getSolutionView(): SolutionView {
    const solutionViewDTOElement = document.getElementById('solution-view-dto');
    if (!solutionViewDTOElement?.textContent) {
        throw new Error("SolutionViewDTO missing content");
    }

    const solutionViewDTO = JSON.parse(solutionViewDTOElement.textContent);
    return SolutionView.fromDTO(solutionViewDTO)
}

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement = getTableElement();
    const boardView = getBoardView();
    const solutionView = getSolutionView();
    console.log(solutionView)

   renderBoard(tableElement, boardView);
});

function renderBoard(tableElement: HTMLTableElement, boardView: BoardView) {  
    const tbody = createTableBody(boardView);
    const caption = createCaption(boardView);
    tableElement.appendChild(caption);
    tableElement.appendChild(tbody);
  }
