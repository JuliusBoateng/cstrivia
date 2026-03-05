import {BoardView} from "./model.js";

function createTableBodyElement(boardView: BoardView): HTMLTableSectionElement {
    const rows = boardView.board.rows;
    const cols = boardView.board.cols;

    const labelNumberRef = {value : 1};
    const tbody = document.createElement("tbody");
    for (let row = 0; row < rows; row++) {
        const rowElement = createRowElement(row, cols, boardView, labelNumberRef)
        tbody.appendChild(rowElement);
    }

    return tbody;
}

function createRowElement(row: number, cols: number, boardView: BoardView, labelNumberRef: {value : number}): HTMLTableRowElement {
    const rowElement = document.createElement("tr")
    rowElement.setAttribute("data-row", row.toString());
    
    for (let col = 0; col < cols; col++) {
        const cellElement =  createCellElement(row, col, boardView, labelNumberRef)
        rowElement.appendChild(cellElement);
    }

    return rowElement;
}

function createCaptionElement(boardView: BoardView): HTMLTableCaptionElement {
    const caption = document.createElement("caption");
    caption.textContent = boardView.board.title;

    return caption;
}

function createCellElement(row: number, col: number, boardView: BoardView, labelNumberRef: {value : number}) {
    const cellElement = document.createElement("td") as HTMLTableCellElement;
    cellElement.classList.add("cell")
    cellElement.setAttribute("data-col", col.toString());
    cellElement.setAttribute("data-row", row.toString());

    const cell = boardView.getCell(row, col)
    
    if (!cell) {
        cellElement.classList.add("block");
        return cellElement;
    }

    const innerDiv = createInnerDivElement(row, col, boardView, labelNumberRef);
    cellElement.appendChild(innerDiv);
    
    return cellElement;
}

function createInnerDivElement(row: number, col: number, boardView: BoardView, labelNumberRef: {value : number}) {
    const divElement = document.createElement("div");
    divElement.classList.add("fill")

    const isPlacementStart = boardView.isPlacementStart(row, col)
    if (isPlacementStart) {
        const spanElement = createInnerSpanElement(labelNumberRef.value)
        divElement.appendChild(spanElement);

        labelNumberRef.value += 1;
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