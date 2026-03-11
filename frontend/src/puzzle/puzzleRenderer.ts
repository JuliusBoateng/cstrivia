import {BoardDom} from "../render/boardDomBuilder.js";

class PuzzleRenderer {
    cellGrid: HTMLTableCellElement[][];
    inputGrid: HTMLInputElement[][];
    highlightedPlacementId: number;
    highlightedPlacementCells: HTMLTableCellElement[];
    highlightedCursor: HTMLTableCellElement | null = null;

    constructor(boardDom: BoardDom) {
        this.cellGrid = boardDom.cellGrid;
        this.inputGrid = boardDom.inputGrid;
        this.highlightedPlacementId = -1;
        this.highlightedPlacementCells = [];
        this.highlightedCursor = null;
    }

    renderLetter(row: number, col: number, letter: string | null) {
        const inputElement: HTMLInputElement = this.inputGrid[row][col];
        if (!inputElement) {
            throw Error("Unable to write to cell.")
        }

        inputElement.value = letter ?? ""
    }

    focusCell(row: number, col: number) {
        const inputElement: HTMLInputElement = this.inputGrid[row][col];
        if (!inputElement) {
            throw Error("Unable to focus cell.")
        }

        inputElement.focus()
    }

    setCursorHighlight(row: number, col: number) {
        const cell = this.cellGrid[row][col];
        if (cell.classList.contains("block")) {
            throw Error("Unable to highlight cursor.");
        }
    
        if (this.highlightedCursor === cell) return;

        this.clearCursorHighlight();
        cell.classList.add("highlight-cursor");
        this.highlightedCursor = cell;
    }

    clearCursorHighlight() {
        if (!this.highlightedCursor) return;

        this.highlightedCursor.classList.remove("highlight-cursor");
        this.highlightedCursor = null;
    }

    setPlacementHighlight(placementId: number, coords: { row: number; col: number }[]) {
        if (this.highlightedPlacementId === placementId) return;
        
        this.clearPlacementHighlight();
        for (const { row, col } of coords) {
            const cell = this.cellGrid[row][col];
    
            if (cell.classList.contains("block")) {
                throw Error("Unable to highlight placement.");
            }
    
            cell.classList.add("highlight-word");
            this.highlightedPlacementCells.push(cell);
        }
        this.highlightedPlacementId = placementId;
    }

    clearPlacementHighlight() {
        for (const cell of this.highlightedPlacementCells) {
            cell.classList.remove("highlight-word");
        }
        this.highlightedPlacementId = -1;
        this.highlightedPlacementCells = [];
    }
}

export {PuzzleRenderer};
