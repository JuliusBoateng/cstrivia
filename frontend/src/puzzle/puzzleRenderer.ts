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

    renderLetter(coord: Coord, letter: string | null) {
        const inputElement: HTMLInputElement = this.inputGrid[coord.row][coord.col];
        if (!inputElement) return;

        inputElement.value = letter ?? ""
    }

    focusCell(coord: Coord) {
        const inputElement: HTMLInputElement = this.inputGrid[coord.row][coord.col];
        if (!inputElement) return;

        inputElement.focus()
    }

    setCursorHighlight(coord: Coord) {
        const cell = this.cellGrid[coord.row][coord.col];
        if (cell.classList.contains("block")) return;
        if (this.highlightedCursor === cell) return;

        this.clearCursorHighlight();
        cell.classList.add("highlight-cursor");
        this.highlightedCursor = cell;
    }

    setPlacementHighlight(placementId: number, coords: Coord[]) {
        if (this.highlightedPlacementId === placementId) return;
        this.clearPlacementHighlight();
        
        const cells: HTMLTableCellElement[] = [];
        for (const { row, col } of coords) {
            const cell = this.cellGrid[row][col];
            if (cell.classList.contains("block")) return;
    
            cell.classList.add("highlight-word");
            cells.push(cell);
        }
        this.highlightedPlacementCells = cells
        this.highlightedPlacementId = placementId;
    }

    markPlacementSolved(coords: Coord[]) {
        const className = "placement-success";
        const fillElements = this.getFillElements(coords);
        this.animateElements(fillElements, className);
    }

    markPlacementIncorrect(coords: Coord[]) {
        const className = "placement-error";
        const fillElements = this.getFillElements(coords);
        this.animateElements(fillElements, className);
    }

    markPuzzleComplete(playableCells: Coord[]) {
        const fillElements = this.getFillElements(playableCells);
        this.animateElements(fillElements, "placement-success");
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

    private getFillElements(coords: Coord[]): HTMLElement[] {
        const fills = coords.map(coord => this.cellGrid[coord.row][coord.col].querySelector(".fill"))
                        .filter((fill): fill is HTMLElement => (fill !== null));
        return fills;
    }

    private animateElements(elements: HTMLElement[], className: string) {
        this.clearAnimation(elements);

        // Double requestAnimationFrame ensures the browser processes the class
        // removal in a separate frame before re-adding it. Otherwise the DOM
        // changes may be batched together and the animation will not restart.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                elements.forEach(element => element.classList.add(className));
            });
        });
    }
    
    private clearAnimation(elements: HTMLElement[]) {
        elements.forEach(element => element.classList.remove("placement-success", "placement-error"));
    }
}

export {PuzzleRenderer};
