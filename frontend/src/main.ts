import {Board, Placement, Cell, Clue, Direction} from "./model.js";

function createTableRows(num_rows: number, num_cols: number) {
    const rows = [];
    for (let r = 0; r < num_rows; r++) {
        let row = document.createElement("tr")
        row.setAttribute("data-row", r.toString());
        
        for (let c = 0; c < num_cols; c++) {
            let cell = document.createElement("td");
            cell.setAttribute("data-col", c.toString());
            cell.appendChild(document.createElement("div"))

            row.appendChild(cell)
        }
        rows.push(row)
    }
    return rows;
}

document.addEventListener("DOMContentLoaded", (event) => {
    let body = document.querySelector("#puzzle > tbody")
    if (body === null) {
        return;
    }

    let boardView = document.getElementById('board-view');
    console.log(boardView)

    let rows = createTableRows(15, 15);
    rows.forEach(row => body.appendChild(row));
});