import {Board, Placement, Cell, Clue, Direction, BoardView, BoardViewDTO} from "./model.js";

function createTableRows(num_rows: number, num_cols: number) {
    const rows = [];
    for (let r = 0; r < num_rows; r++) {
        const row = document.createElement("tr")
        row.setAttribute("data-row", r.toString());
        
        for (let c = 0; c < num_cols; c++) {
            const cell = document.createElement("td");
            cell.setAttribute("data-col", c.toString());
            cell.appendChild(document.createElement("div"))

            row.appendChild(cell)
        }
        rows.push(row)
    }
    return rows;
}

document.addEventListener("DOMContentLoaded", (event) => {
    const tbodyElement = document.querySelector("#puzzle > tbody")
    if (!tbodyElement) {
        throw new Error("Table body is not available");
    }

    const boardViewDTOElement = document.getElementById('board-view-dto');
    if (!boardViewDTOElement?.textContent) {
        throw new Error("BoardViewDTO missing content");
    }

    const boardViewDTO = JSON.parse(boardViewDTOElement.textContent) as BoardViewDTO;
    const boardView = BoardView.fromDTO(boardViewDTO)
    console.log(boardView)

    const rows = boardView.board.rows;
    const cols = boardView.board.cols;
    const rowElements = createTableRows(rows, cols);
    rowElements.forEach(r => tbodyElement.appendChild(r));
});
