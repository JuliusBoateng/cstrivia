import {BoardView} from "./model.js";

function createTableBody(boardView: BoardView): HTMLTableSectionElement {
    const rows = boardView.board.rows;
    const cols = boardView.board.cols;

    const tbody = document.createElement("tbody");
    for (let row = 0; row < rows; row++) {
        const rowElement = createRow(row, cols)
        tbody.appendChild(rowElement);
    }

    return tbody;

    function createRow(row: number, cols: number): HTMLTableRowElement {
        const rowElement = document.createElement("tr")
        rowElement.dataset.row = row.toString();
        
        for (let col = 0; col < cols; col++) {
            const cellElement =  createCell(row, col)
            rowElement.appendChild(cellElement);
        }

        return rowElement;
    }

    function createCell(row: number, col: number): HTMLTableCellElement {
        const cellElement = document.createElement("td");
        cellElement.classList.add("cell")
        cellElement.dataset.col = col.toString();
        cellElement.dataset.row = row.toString();
        
        if (!boardView.getCell(row, col)) {
            cellElement.classList.add("block");
            return cellElement;
        }

        const innerDiv = createDiv(row, col);
        cellElement.appendChild(innerDiv);
        
        return cellElement;
    }

    function createDiv(row: number, col: number): HTMLDivElement {
        const divElement = document.createElement("div");
        divElement.classList.add("fill")

        const labelNumber = boardView.getLabel(row, col);
        if (boardView.isPlacementStart(row, col) && labelNumber) {
            const spanElement = createSpan(labelNumber)
            divElement.appendChild(spanElement);
        }

        const inputElement = createLabel()
        divElement.appendChild(inputElement);

        return divElement;
    }

    function createSpan(labelNumber: number): HTMLSpanElement {
        const spanElement = document.createElement("span");
        spanElement.classList.add("label");

        spanElement.textContent = labelNumber.toString();
        return spanElement
    }

    function createLabel(): HTMLInputElement {
        const inputElement = document.createElement("input");
        inputElement.maxLength = 1;
        inputElement.autocomplete = "off";
        inputElement.spellcheck = false;
        inputElement.autocapitalize = "characters";
        inputElement.classList.add("letter");

        return inputElement;
    }
}

function createCaption(boardView: BoardView): HTMLTableCaptionElement {
    const caption = document.createElement("caption");
    caption.textContent = boardView.board.title;

    return caption;
}

export {createTableBody, createCaption};