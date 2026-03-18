import { BoardDom } from "../board/boardBuilder.js";
import { Coord } from "../models/boardView.js";

const ANIMATION_SUCCESS = "placement-success";
const ANIMATION_ERROR = "placement-error";
const HIGHLIGHT_CURSOR = "highlight-cursor";
const HIGHLIGHT_WORD = "highlight-word";
const DIRECTION_REJECTION = "direction-reject";
const INITIAL_FOCUS = "initial-focus";
const BLOCK = "block";

class PuzzleRenderer {
    private cellGrid: HTMLTableCellElement[][];
    private inputGrid: HTMLInputElement[][];
    private highlightedPlacementId: number;
    private highlightedPlacementCells: HTMLTableCellElement[];
    private highlightedCursor: HTMLTableCellElement | null;
    private boardHeader: HTMLParagraphElement;

    constructor(boardDom: BoardDom) {
        this.cellGrid = boardDom.cellGrid;
        this.inputGrid = boardDom.inputGrid;
        this.highlightedPlacementId = -1;
        this.highlightedPlacementCells = [];
        this.highlightedCursor = null;

        this.boardHeader = this.initializeBoardHeader();
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
        if (cell.classList.contains(BLOCK)) return;
        if (this.highlightedCursor === cell) return;

        this.clearCursorHighlight();
        cell.classList.add(HIGHLIGHT_CURSOR);
        this.highlightedCursor = cell;
    }

    setPlacementHighlight(placementId: number, coords: Coord[]) {
        if (this.highlightedPlacementId === placementId) return;
        this.clearPlacementHighlight();
        
        const cells: HTMLTableCellElement[] = [];
        for (const { row, col } of coords) {
            const cell = this.cellGrid[row][col];
            if (cell.classList.contains(BLOCK)) return;
    
            cell.classList.add(HIGHLIGHT_WORD);
            cells.push(cell);
        }
        this.highlightedPlacementCells = cells
        this.highlightedPlacementId = placementId;
    }

    renderInitialFocus(coords: Coord[]) {
        const className = INITIAL_FOCUS;
        const fillElements = this.getFillElements(coords);
        this.animateElements(fillElements, className);
    }

    renderDirectionRejection(coords: Coord[]) {
        const className = DIRECTION_REJECTION;
        const fillElements = this.getFillElements(coords);
        this.animateElements(fillElements, className);
    }

    markPlacementSolved(coords: Coord[]) {
        const className = ANIMATION_SUCCESS;
        const fillElements = this.getFillElements(coords);
        this.animateElements(fillElements, className);
    }

    markPlacementIncorrect(coords: Coord[]) {
        const className = ANIMATION_ERROR;
        const fillElements = this.getFillElements(coords);
        this.animateElements(fillElements, className);
    }

    markPuzzleComplete(playableCells: Coord[]) {
        const fillElements = this.getFillElements(playableCells);
        this.animateElements(fillElements, ANIMATION_SUCCESS);
    }

    updateBoardHeader(captionText: string) {
        this.boardHeader.textContent = captionText;    
        this.boardHeader.title = captionText;
    }

    private initializeBoardHeader(): HTMLParagraphElement {
        const boardWrapper = document.querySelector(".board-wrapper")!;

        const boardHeader = document.createElement("p");
        boardHeader.classList.add("board-header");
        boardHeader.textContent = "Click a cell to begin";
        boardHeader.title = "Click a cell to begin";

        boardWrapper.prepend(boardHeader);
        return boardHeader;
    }

    private clearPlacementHighlight() {
        for (const cell of this.highlightedPlacementCells) {
            cell.classList.remove(HIGHLIGHT_WORD);
        }
        this.highlightedPlacementId = -1;
        this.highlightedPlacementCells = [];
    }

    private clearCursorHighlight() {
        if (!this.highlightedCursor) return;

        this.highlightedCursor.classList.remove(HIGHLIGHT_CURSOR);
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
        elements.forEach(element => element.classList.remove(ANIMATION_SUCCESS, ANIMATION_ERROR, DIRECTION_REJECTION, INITIAL_FOCUS));
    }
}

export { PuzzleRenderer };

