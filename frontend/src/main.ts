import {BoardView, BoardViewDTO, Coord} from "./model.js";

function createCellElement(row: number, col: number, boardView: BoardView, labelNumberRef: {value : number}) {
    const cellElement = document.createElement("td") as HTMLTableCellElement;
    cellElement.classList.add("cell")
    cellElement.setAttribute("data-col", col.toString());
    cellElement.setAttribute("data-row", row.toString());

    const coord = [row, col] as Coord;
    const cell = boardView.getCellFromCoord(coord)
    
    if (!cell) {
        cellElement.classList.add("block");
        return cellElement;
    }

    const innerDiv = createInnerDivElement(coord, boardView, labelNumberRef);
    cellElement.appendChild(innerDiv);
    
    return cellElement;
}

function createInnerDivElement(coord: Coord, boardView: BoardView, labelNumberRef: {value : number}) {
    const divElement = document.createElement("div");
    divElement.classList.add("fill")

    const isPlacementStart = boardView.isCoordPlacementStart(coord)
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

function createRowElements(boardView: BoardView): HTMLTableRowElement[] {
    const rows = boardView.board.rows;
    const cols = boardView.board.cols;

    const rowElements = [];
    const labelNumberRef = {"value" : 1};
    for (let row = 0; row < rows; row++) {
        const rowElement = document.createElement("tr")
        rowElement.setAttribute("data-row", row.toString());
        
        for (let col = 0; col < cols; col++) {
            const cellElement =  createCellElement(row, col, boardView, labelNumberRef)
            rowElement.appendChild(cellElement);
        }
        
        rowElements.push(rowElement);
    }
    return rowElements;
}

function getBoardTableElement(): HTMLTableElement {
    const tableElement = document.querySelector("#board") as HTMLTableElement;
    if (!tableElement) {
        throw new Error("Table is not available");
    }

    return tableElement;
}

function getBoardView(): BoardView {
    const boardViewDTOElement = document.getElementById('board-view-dto');
    if (!boardViewDTOElement?.textContent) {
        throw new Error("BoardViewDTO missing content");
    }

    const boardViewDTO = JSON.parse(boardViewDTOElement.textContent) as BoardViewDTO;
    return BoardView.fromDTO(boardViewDTO)
}

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement = getBoardTableElement();
    const boardView = getBoardView();

    const board = boardView.board

    const captionElement = document.createElement("caption")
    captionElement.textContent = board.title

    const rowElements = createRowElements(boardView);

    const tbodyElement = document.createElement("tbody")
    rowElements.forEach(r => tbodyElement.appendChild(r));

    tableElement.appendChild(captionElement)
    tableElement.appendChild(tbodyElement)
});
