import {Cell, BoardView, BoardViewDTO} from "./model.js";

function createTableRows(boardRows: number, boardCols: number, cellMap: Record<string, Cell>): HTMLTableRowElement[] {
    const rows = [];
    for (let r = 0; r < boardRows; r++) {
        const row = document.createElement("tr")
        row.setAttribute("data-row", r.toString());
        
        for (let c = 0; c < boardCols; c++) {
            const cell = document.createElement("td") as HTMLTableCellElement;
            cell.setAttribute("data-col", c.toString());
            cell.appendChild(document.createElement("div"))
            
            let coord = `(${r},${c})`;
            if (coord in cellMap) {
                cell.setAttribute("contenteditable", "true")
            } else {
                cell.classList.add("block")
            }
            
            row.appendChild(cell)
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
