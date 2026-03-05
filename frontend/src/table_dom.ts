import {BoardView} from "./model.js";

function createTableBodyElement(boardView: BoardView): HTMLTableSectionElement {
    const rows = boardView.board.rows;
    const cols = boardView.board.cols;

    const tbody = document.createElement("tbody");
    for (let row = 0; row < rows; row++) {
        const rowElement = createRowElement(row, cols, boardView)
        tbody.appendChild(rowElement);
    }

    return tbody;
}

function createRowElement(row: number, cols: number, boardView: BoardView): HTMLTableRowElement {
    const rowElement = document.createElement("tr")
    rowElement.setAttribute("data-row", row.toString());
    
    for (let col = 0; col < cols; col++) {
        const cellElement =  createCellElement(row, col, boardView)
        rowElement.appendChild(cellElement);
    }

    return rowElement;
}

function createCaptionElement(boardView: BoardView): HTMLTableCaptionElement {
    const caption = document.createElement("caption");
    caption.textContent = boardView.board.title;

    return caption;
}

function createCellElement(row: number, col: number, boardView: BoardView) {
    const cellElement = document.createElement("td") as HTMLTableCellElement;
    cellElement.classList.add("cell")
    cellElement.setAttribute("data-col", col.toString());
    cellElement.setAttribute("data-row", row.toString());
    
    if (!boardView.getCell(row, col)) {
        cellElement.classList.add("block");
        return cellElement;
    }

    const innerDiv = createInnerDivElement(row, col, boardView);
    cellElement.appendChild(innerDiv);
    
    return cellElement;
}

function createInnerDivElement(row: number, col: number, boardView: BoardView) {
    const divElement = document.createElement("div");
    divElement.classList.add("fill")

    const labelNumber = boardView.getLabel(row, col);
    if (boardView.isPlacementStart(row, col) && labelNumber) {
        const spanElement = createInnerSpanElement(labelNumber)
        divElement.appendChild(spanElement);
    }

    const inputElement = createInnerInputElement()
    divElement.appendChild(inputElement);

    return divElement;
}

function createInnerSpanElement(labelNumber: number): HTMLSpanElement {
    const spanElement = document.createElement("span");
    spanElement.classList.add("label");

    spanElement.textContent = labelNumber.toString();
    return spanElement
}

function createInnerInputElement(): HTMLInputElement {
    const inputElement = document.createElement("input") as HTMLInputElement;
    inputElement.maxLength = 1;
    inputElement.autocomplete = "off";
    inputElement.spellcheck = false;
    inputElement.autocapitalize = "characters";
    inputElement.classList.add("letter");

    return inputElement;
}

export {createTableBodyElement, createCaptionElement};