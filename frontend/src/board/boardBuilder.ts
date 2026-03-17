import { BoardView, Coord, Direction } from "../models/boardView.js";

interface BoardDom {
    cellGrid: HTMLTableCellElement[][];
    inputGrid: HTMLInputElement[][];
}

const BLOCK = "block";
const CELL = "cell";
const FILL = "fill";

function createBoard(boardView: BoardView, tableElement: HTMLTableElement): BoardDom {
    const cellGrid: (HTMLTableCellElement | null)[][] = initializeGrid()
    const inputGrid: (HTMLInputElement | null)[][] = initializeGrid()

    const captionElement = createCaptionElement();
    tableElement.appendChild(captionElement);

    const tbodyElement = createTableBodyElement();
    tableElement.appendChild(tbodyElement);
    
    const dom: BoardDom = {
        cellGrid: cellGrid as HTMLTableCellElement[][],
        inputGrid: inputGrid as HTMLInputElement[][]
    }
    
    return dom;
    
    function initializeGrid<T>(): (T | null)[][] {
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
            const coord = {row, col};
            const cellElement =  createTableCellElement(coord)

            cellGrid[row][col] = cellElement;
            rowElement.appendChild(cellElement);
        }

        return rowElement;
    }

    function createTableCellElement(coord: Coord): HTMLTableCellElement {
        const cellElement = document.createElement("td");
        cellElement.classList.add(CELL)
        cellElement.dataset.col = coord.col.toString();
        cellElement.dataset.row = coord.row.toString();
        
        const cell = boardView.getCell(coord)
        if (!cell) {
            cellElement.classList.add(BLOCK);
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
        
        const fillContainer = createFillContainer(coord);
        cellElement.appendChild(fillContainer);
        
        return cellElement;
    }

    function createEmptyFillContainer(): HTMLDivElement {
        const divElement = document.createElement("div");
        divElement.classList.add(FILL)
        return divElement
    }

    function createFillContainer(coord: Coord): HTMLDivElement {
        const divElement = createEmptyFillContainer();

        const startingCell = boardView.isStartingCell(coord);
        if (startingCell) {
            const labelNumber = boardView.getLabel(coord);

            const spanElement = createSpanElement(labelNumber)
            divElement.appendChild(spanElement);
        }

        const inputElement = createInputElement();
        inputGrid[coord.row][coord.col] = inputElement;
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
        inputElement.inputMode="text";
        inputElement.classList.add("letter");

        return inputElement;
    }

    function createCaptionElement(): HTMLTableCaptionElement {
        const caption = document.createElement("caption");
        caption.textContent = boardView.board.title;

        return caption;
    }
}

export { BoardDom, createBoard };

