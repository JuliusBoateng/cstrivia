import {Cell, BoardView, BoardViewDTO} from "./model.js";

function createTableRows(boardRows: number, boardCols: number, cellMap: Record<string, Cell>): HTMLTableRowElement[] {
    const rows = [];
    for (let r = 0; r < boardRows; r++) {
        const row = document.createElement("tr")
        row.setAttribute("data-row", r.toString());
        
        for (let c = 0; c < boardCols; c++) {
            const cellElement = document.createElement("td") as HTMLTableCellElement;
            const divElement = document.createElement("div")

            cellElement.classList.add("cell")
            cellElement.setAttribute("data-col", c.toString());
            
            let coord = `(${r},${c})`;
            if (coord in cellMap) {
                divElement.setAttribute("contenteditable", "true")
            } else {
                cellElement.classList.add("block")
            }
            
            cellElement.appendChild(divElement)
            row.appendChild(cellElement)
        }
        rows.push(row)
    }
    return rows;
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

    const rowElements = createTableRows(board.rows, board.cols, boardView.cellMap);

    const tbodyElement = document.createElement("tbody")
    rowElements.forEach(r => tbodyElement.appendChild(r));

    tableElement.appendChild(captionElement)
    tableElement.appendChild(tbodyElement)
});
