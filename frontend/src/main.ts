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
        console.log("NULLLL")
        return;
    }

    let boardView = document.getElementById('board-view');
    console.log(boardView)

    let rows = createTableRows(15, 15);
    rows.forEach(row => body.appendChild(row));
});