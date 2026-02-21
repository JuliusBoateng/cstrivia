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

    rows = createTableRows(15, 15);
    rows.forEach(row => body.appendChild(row));
});