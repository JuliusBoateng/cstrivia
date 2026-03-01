class Board {
    constructor(title, rows, cols, categories, createdAt, updatedAt) {
        this.title = title;
        this.rows = rows;
        this.cols = cols;
        this.categories = categories;
    }
}


    "board": {
        "title": "Foundations of Open Source Software",
        "rows": 15,
        "cols": 15,
        "categories": [
            "Open Source"
        ],
        "created_at": "2026-02-21T01:37:35.813074+00:00",
        "updated_at": "2026-02-25T20:46:16.294438+00:00"
    },

function createTableRows(num_rows, num_cols) {
    rows = [];
    for (r = 0; r < num_rows; r++) {
        row = document.createElement("tr")
        row.setAttribute("data-row", r);
        
        for (c = 0; c < num_cols; c++) {
            cell = document.createElement("td");
            cell.setAttribute("data-col", c);
            cell.appendChild(document.createElement("div"))

            row.appendChild(cell)
        }
        rows.push(row)
    }
    return rows;
}

document.addEventListener("DOMContentLoaded", (event) => {
    body = document.querySelector("#puzzle > tbody")

    boardView = document.getElementById('board-view');
    console.log(boardView)

    rows = createTableRows(15, 15);
    rows.forEach(row => body.appendChild(row));
});