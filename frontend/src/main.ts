import {BoardView, BoardViewDTO} from "./model.js";
import {createTableBodyElement, createCaptionElement} from "./table_dom.js";

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

    const boardViewDTO = JSON.parse(boardViewDTOElement.textContent) as BoardViewDTO;
    return BoardView.fromDTO(boardViewDTO)
}

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement = getTableElement();
    const boardView = getBoardView();

   renderBoard(tableElement, boardView);
});


function renderBoard(tableElement: HTMLTableElement, boardView: BoardView) {  
    const tbody = createTableBodyElement(boardView);
    const caption = createCaptionElement(boardView);
    tableElement.appendChild(caption);
    tableElement.appendChild(tbody);
  }