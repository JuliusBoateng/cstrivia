import {BoardView, BoardViewDTO} from "./model.js";

function createTableRows(num_rows: number, num_cols: number): HTMLTableRowElement[] {
    const rows = [];
    for (let r = 0; r < num_rows; r++) {
        const row = document.createElement("tr")
        row.setAttribute("data-row", r.toString());
        
        for (let c = 0; c < num_cols; c++) {
            const cell = document.createElement("td");
            cell.classList.add("block")
            cell.setAttribute("data-col", c.toString());
            cell.appendChild(document.createElement("div"))

            row.appendChild(cell)
        }
        rows.push(row)
    }
    return rows;
}

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement = document.querySelector("#puzzle")
    if (!tableElement) {
        throw new Error("Table is not available");
    }

    const boardViewDTOElement = document.getElementById('board-view-dto');
    if (!boardViewDTOElement?.textContent) {
        throw new Error("BoardViewDTO missing content");
    }

    const boardViewDTO = JSON.parse(boardViewDTOElement.textContent) as BoardViewDTO;
    const boardView = BoardView.fromDTO(boardViewDTO)
    console.log(boardView)

    const board = boardView.board

    const captionElement = document.createElement("caption")
    captionElement.textContent = board.title
    console.log(captionElement.textContent)

    const rows = board.rows;
    const cols = board.cols;
    const rowElements = createTableRows(rows, cols);

    const tbodyElement = document.createElement("tbody")
    rowElements.forEach(r => tbodyElement.appendChild(r));

    tableElement.appendChild(captionElement)
    tableElement.appendChild(tbodyElement)
});
