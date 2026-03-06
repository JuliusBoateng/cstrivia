import {BoardView} from "../models/boardView.js";

class BoardDomBuilder {
    boardView: BoardView;
    tableElement: HTMLTableElement

    constructor(boardView: BoardView, tableElement: HTMLTableElement) {
        this.boardView = boardView;
        this.tableElement = tableElement;
    }

    buildTable() {  
        const tbody = this.createTableBody();
        const caption = this.createCaption();
        this.tableElement.appendChild(caption);
        this.tableElement.appendChild(tbody);
    }

    createTableBody(): HTMLTableSectionElement {
        const rows = this.boardView.board.rows;
        const cols = this.boardView.board.cols;
    
        const tbody = document.createElement("tbody");
        for (let row = 0; row < rows; row++) {
            const rowElement = this.createRow(row, cols)
            tbody.appendChild(rowElement);
        }
    
        return tbody;
    }
    
    private createRow(row: number, cols: number): HTMLTableRowElement {
        const rowElement = document.createElement("tr")
        rowElement.dataset.row = row.toString();
        
        for (let col = 0; col < cols; col++) {
            const cellElement =  this.createCell(row, col)
            rowElement.appendChild(cellElement);
        }

        return rowElement;
    }

    private createCell(row: number, col: number): HTMLTableCellElement {
        const cellElement = document.createElement("td");
        cellElement.classList.add("cell")
        cellElement.dataset.col = col.toString();
        cellElement.dataset.row = row.toString();
        
        if (!this.boardView.getCell(row, col)) {
            cellElement.classList.add("block");
            return cellElement;
        }

        const innerDiv = this.createDiv(row, col);
        cellElement.appendChild(innerDiv);
        
        return cellElement;
    }

    private createDiv(row: number, col: number): HTMLDivElement {
        const divElement = document.createElement("div");
        divElement.classList.add("fill")

        const labelNumber = this.boardView.getLabel(row, col);
        if (this.boardView.isPlacementStart(row, col) && labelNumber) {
            const spanElement = this.createSpan(labelNumber)
            divElement.appendChild(spanElement);
        }

        const inputElement = this.createLabel()
        divElement.appendChild(inputElement);

        return divElement;
    }

    private createSpan(labelNumber: number): HTMLSpanElement {
        const spanElement = document.createElement("span");
        spanElement.classList.add("label");

        spanElement.textContent = labelNumber.toString();
        return spanElement
    }

    private createLabel(): HTMLInputElement {
        const inputElement = document.createElement("input");
        inputElement.maxLength = 1;
        inputElement.autocomplete = "off";
        inputElement.spellcheck = false;
        inputElement.autocapitalize = "characters";
        inputElement.classList.add("letter");

        return inputElement;
    }

    private createCaption(): HTMLTableCaptionElement {
        const caption = document.createElement("caption");
        caption.textContent = this.boardView.board.title;

        return caption;
    }
}

export {BoardDomBuilder};