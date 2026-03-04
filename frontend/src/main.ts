import {BoardView, BoardViewDTO, Coord} from "./model.js";

function createTableRows(boardView: BoardView): HTMLTableRowElement[] {
    const rows = boardView.board.rows;
    const cols = boardView.board.cols;

    let labelNumber = 1;
    const rowElements = [];
    for (let row = 0; row < rows; row++) {
        const rowElement = document.createElement("tr")
        rowElement.setAttribute("data-row", row.toString());
        
        
        for (let col = 0; col < cols; col++) {
            const cellElement = document.createElement("td") as HTMLTableCellElement;
            const divElement = document.createElement("div");
            divElement.classList.add("fill")
            cellElement.classList.add("cell")
            cellElement.setAttribute("data-col", col.toString());
            
            const coord = [row, col] as Coord;
            if (boardView.getCellFromCoord(coord)) {
                const spanElement = document.createElement("span");
                spanElement.classList.add("label");

                if (boardView.isCoordPlacementStart(coord)) {
                    spanElement.textContent = labelNumber.toString();
                    divElement.appendChild(spanElement);
                    labelNumber += 1;
                }

                const inputElement = document.createElement("input") as HTMLInputElement;
                inputElement.maxLength = 1;
                inputElement.autocomplete = "off";
                inputElement.spellcheck = false;
                inputElement.autocapitalize = "characters";
                inputElement.classList.add("letter");

                divElement.appendChild(inputElement);                
            } else {
                cellElement.classList.add("block");
            }
            
            cellElement.appendChild(divElement);
            rowElement.appendChild(cellElement);
        }
        rowElements.push(rowElement);
    }
    return rowElements;
}

function getBoardTableElement(): HTMLTableElement {
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
    const tableElement = getBoardTableElement();
    const boardView = getBoardView();

    const board = boardView.board

    const captionElement = document.createElement("caption")
    captionElement.textContent = board.title

    const rowElements = createTableRows(boardView);

    const tbodyElement = document.createElement("tbody")
    rowElements.forEach(r => tbodyElement.appendChild(r));

    tableElement.appendChild(captionElement)
    tableElement.appendChild(tbodyElement)
});
