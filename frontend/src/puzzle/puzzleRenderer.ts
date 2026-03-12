import {BoardDom} from "../render/boardDomBuilder.js";
import {Coord} from "../models/boardView.js";

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

    markPlacementSolved(coords: Coord[]) {
        const className = "placement-success-pulse";
        const cells = coords.map(coord => this.cellGrid[coord.row][coord.col])
        this.pulse(cells, className);
    }

    markPlacementIncorrect(coords: Coord[]) {
        const className = "placement-error-pulse";
        const cells = coords.map(coord => this.cellGrid[coord.row][coord.col])
        this.pulse(cells, className);
    }

    markPuzzleComplete(playableCells: Coord[]) {
        const cells = playableCells.map(playableCell => this.cellGrid[playableCell.row][playableCell.col])
        this.pulse(cells, "placement-success-pulse");
    }

    private clearPlacementHighlight() {
        for (const cell of this.highlightedPlacementCells) {
            cell.classList.remove("highlight-word");
        }
        this.highlightedPlacementId = -1;
        this.highlightedPlacementCells = [];
    }

    private clearCursorHighlight() {
        if (!this.highlightedCursor) return;

        this.highlightedCursor.classList.remove("highlight-cursor");
        this.highlightedCursor = null;
    }

    private pulse(cells: HTMLElement[], className: string) {
        this.clearAnimation(cells);

        // Double requestAnimationFrame ensures the browser processes the class
        // removal in a separate frame before re-adding it. Otherwise the DOM
        // changes may be batched together and the animation will not restart.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                cells.forEach(cell => cell.classList.add(className));
            });
        });
    }
    
    private clearAnimation(cells: HTMLElement[]) {
        cells.forEach(cell => cell.classList.remove("placement-success-pulse", "placement-error-pulse"));
    }
}

export {PuzzleRenderer};
