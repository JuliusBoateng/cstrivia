import {BoardView, Direction} from "../models/boardView.js";

interface BoardDom {
    tableElement: HTMLTableElement;
    cellGrid: HTMLTableCellElement[][];
    inputGrid: HTMLInputElement[][];
}

function createBoard(boardView: BoardView, tableElement: HTMLTableElement): BoardDom {
    const cellGrid = initializeGrid()
    const inputGrid = initializeGrid()

    const captionElement = createCaptionElement();
    tableElement.appendChild(captionElement);

    const tbodyElement = createTableBodyElement();
    tableElement.appendChild(tbodyElement);
    
    const dom: BoardDom = {
        tableElement: tableElement,
        cellGrid: cellGrid as HTMLTableCellElement[][],
        inputGrid: inputGrid as HTMLInputElement[][]
    }
    
    return dom;
    

    function initializeGrid(): HTMLElement[][] {
        const rows = boardView.board.rows;
        const cols = boardView.board.cols;
        return Array.from({ length: rows }, () => Array(cols).fill(null))
    }

    function createTableBodyElement(): HTMLTableSectionElement {
        const rows = boardView.board.rows;
        const cols = boardView.board.cols;
    
        const tbodyElement = document.createElement("tbody");
        for (let row = 0; row < rows; row++) {
            const rowElement = createTableRowElement(row, cols)
            tbodyElement.appendChild(rowElement);
        }
    
        return tbodyElement;
    }

    function createTableRowElement(row: number, cols: number): HTMLTableRowElement {
        const rowElement = document.createElement("tr")
        rowElement.dataset.row = row.toString();
        
        for (let col = 0; col < cols; col++) {
            const cellElement =  createTableCellElement(row, col)

            cellGrid[row][col] = cellElement;
            rowElement.appendChild(cellElement);
        }

        return rowElement;
    }

    function createTableCellElement(row: number, col: number): HTMLTableCellElement {
        const cellElement = document.createElement("td");
        cellElement.classList.add("cell")
        cellElement.dataset.col = col.toString();
        cellElement.dataset.row = row.toString();
        
        const cell = boardView.getCell(row, col)
        if (!cell) {
            cellElement.classList.add("block");
            const fillContainer = createEmptyFillContainer()
            cellElement.appendChild(fillContainer)
            
            return cellElement;
        }

        if (Direction.A in cell.placement_positions) {
            let placement_id = cell.placement_positions[Direction.A].placement_id
            cellElement.dataset.acrossPlacementId = placement_id.toString();
        }

        if (Direction.D in cell.placement_positions) {
            let placement_id = cell.placement_positions[Direction.D].placement_id
            cellElement.dataset.downPlacementId = placement_id.toString();
        }
        
        const fillContainer = createFillContainer(row, col);
        cellElement.appendChild(fillContainer);
        
        return cellElement;
    }

    function createEmptyFillContainer(): HTMLDivElement {
        const divElement = document.createElement("div");
        divElement.classList.add("fill")
        return divElement
    }

    function createFillContainer(row: number, col: number): HTMLDivElement {
        const divElement = createEmptyFillContainer();

        const startingCell = boardView.isStartingCell(row, col);
        if (startingCell) {
            const labelNumber = boardView.getLabel(row, col);

            const spanElement = createSpanElement(labelNumber)
            divElement.appendChild(spanElement);
        }

        const inputElement = createInputElement();
        inputGrid[row][col] = inputElement;
        divElement.appendChild(inputElement);

        return divElement;
    }

    function createSpanElement(labelNumber: number): HTMLSpanElement {
        const spanElement = document.createElement("span");
        spanElement.classList.add("label");

        spanElement.textContent = labelNumber.toString();
        return spanElement
    }

    function createInputElement(): HTMLInputElement {
        const inputElement = document.createElement("input");
        inputElement.maxLength = 1;
        inputElement.autocomplete = "off";
        inputElement.spellcheck = false;
        inputElement.autocapitalize = "characters";
        inputElement.classList.add("letter");

        return inputElement;
    }

    function createCaptionElement(): HTMLTableCaptionElement {
        const caption = document.createElement("caption");
        caption.textContent = boardView.board.title;

        return caption;
    }
}

export {createBoard, BoardDom};
