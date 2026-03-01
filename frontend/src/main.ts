class Board {
    title: string;
    rows: number;
    cols: number;
    categories: string[];
    createdAt: string;
    updatedAt: string;

    constructor(title: string, rows: number, cols: number, categories: string[] , createdAt: string, updatedAt: string) {
        this.title = title;
        this.rows = rows;
        this.cols = cols;
        this.categories = categories;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

function createTableRows(num_rows: number, num_cols: number) {
    const rows: HTMLTableRowElement[] = [];
    for (r = 0; r < num_rows; r++) {
        const row: HTMLTableRowElement = document.createElement("tr")
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