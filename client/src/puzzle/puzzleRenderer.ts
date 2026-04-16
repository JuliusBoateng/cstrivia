import { BoardDom } from "../board/boardBuilder.js";
import { Coord } from "../models/boardView.js";

const ANIMATION_SUCCESS = "placement-success";
const ANIMATION_ERROR = "placement-error";
const HIGHLIGHT_CURSOR = "highlight-cursor";
const HIGHLIGHT_PLACEMENT = "highlight-placement";
const DIRECTION_REJECTION = "direction-reject";
const BLOCK = "block";
const BOARD_HEADER_DEFAULT = "Click a clue or cell to begin";

class PuzzleRenderer {
    private cellGrid: HTMLTableCellElement[][];
    private fillGrid: (HTMLElement | null)[][];
    private inputGrid: (HTMLInputElement | null)[][];
    private activePlacementId: number;
    private activePlacementCells: HTMLTableCellElement[];
    private activeCursor: HTMLTableCellElement | null;
    private focusedInput: HTMLInputElement | null;
    private boardHeader: HTMLParagraphElement;

    constructor(boardDom: BoardDom) {
        this.cellGrid = boardDom.cellGrid;
        this.fillGrid = boardDom.fillGrid;
        this.inputGrid = boardDom.inputGrid;
        this.activePlacementId = -1;
        this.activePlacementCells = [];
        this.activeCursor = null;
        this.focusedInput = null;

        this.boardHeader = this.initializeBoardHeader();
    }

    renderLetter(coord: Coord, letter: string | null) {
        const inputElement: HTMLInputElement | null = this.inputGrid[coord.row][coord.col];
        if (!inputElement) {
            throw new Error("Input element not found for coord");
        }

        inputElement.value = letter ?? ""
    }

    /*
        Does not highlight or focus cell. Makes cell tab-able
    */
    initActiveCursor(coord: Coord) {
        const cell = this.cellGrid[coord.row][coord.col];
        if (cell.classList.contains(BLOCK)) return;

        this.clearActiveCursor();
        this.activeCursor = cell;
        // No highlight

        // Does not actually focus
        const inputElement: HTMLInputElement | null = this.inputGrid[coord.row][coord.col];
        if (!inputElement) return;

        inputElement.tabIndex = 0;
        this.focusedInput = inputElement;
    }

    renderActiveCursor(coord: Coord) {
        const cell = this.cellGrid[coord.row][coord.col];
        if (cell.classList.contains(BLOCK)) return;
        if (this.activeCursor === cell && cell.classList.contains(HIGHLIGHT_CURSOR)) return;

        this.clearActiveCursor();
        cell.classList.add(HIGHLIGHT_CURSOR);
        this.activeCursor = cell;

        this.setFocus(coord);
    }

    renderActivePlacement(placementId: number, coords: Coord[]) {
        if (this.activePlacementId === placementId) return;
        this.clearActivePlacement();
        
        const cells: HTMLTableCellElement[] = [];
        for (const { row, col } of coords) {
            const cell = this.cellGrid[row][col];
            if (cell.classList.contains(BLOCK)) return;
    
            cell.classList.add(HIGHLIGHT_PLACEMENT);
            cells.push(cell);
        }
        this.activePlacementCells = cells
        this.activePlacementId = placementId;
    }

    clearRenderer() {
        this.clearAllAnimations()
        this.clearInput();
        this.clearActiveCursor();
        this.clearActivePlacement();
        this.clearBoardHeader();
    }

    renderDirectionRejection(coords: Coord[]) {
        const className = DIRECTION_REJECTION;
        const fillElements = this.getFillFromCoords(coords);
        this.animateElements(fillElements, className);
    }

    renderPlacementSolved(coords: Coord[]) {
        const className = ANIMATION_SUCCESS;
        const fillElements = this.getFillFromCoords(coords);
        this.animateElements(fillElements, className);
    }

    renderPlacementIncorrect(coords: Coord[]) {
        const className = ANIMATION_ERROR;
        const fillElements = this.getFillFromCoords(coords);
        this.animateElements(fillElements, className);
    }

    renderPuzzleComplete(playableCells: Coord[]) {
        const fillElements = this.getFillFromCoords(playableCells);
        this.animateElements(fillElements, ANIMATION_SUCCESS);
    }

    renderBoardHeader(captionText: string) {
        this.boardHeader.textContent = captionText;    
        this.boardHeader.title = captionText;
    }

    private animateElements(elements: HTMLElement[], className: string) {
        this.clearAnimations(elements);

        // Double requestAnimationFrame ensures the browser processes the class
        // removal in a separate frame before re-adding it. Otherwise the DOM
        // changes may be batched together and the animation will not restart.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                elements.forEach(element => element.classList.add(className));
            });
        });
    }

    private getFillFromCoords(coords: Coord[]): HTMLElement[] {
        const fills: HTMLElement[] = [];

        for (const coord of coords) {
            let fill = this.fillGrid[coord.row][coord.col];
            if (fill !== null) fills.push(fill);
        }
    
        return fills;
    }

    private setFocus(coord: Coord) {
        const inputElement: HTMLInputElement | null = this.inputGrid[coord.row][coord.col];
        if (!inputElement) return;

        inputElement.tabIndex = 0;
        inputElement.focus();
        inputElement.setSelectionRange(0, 1);
        this.focusedInput = inputElement;
    }

    private clearFocus(): void {
        if (!this.focusedInput) return;

        this.focusedInput.tabIndex = -1;
        this.focusedInput.blur();
        this.focusedInput = null;
    }

    private clearInput() {
        for (const row of this.inputGrid) {
            for (const inputElement of row) {
                if (!inputElement) continue;
                inputElement.value = "";
            }
        }
    }

    private clearActivePlacement() {
        for (const cell of this.activePlacementCells) {
            cell.classList.remove(HIGHLIGHT_PLACEMENT);
        }
        this.activePlacementId = -1;
        this.activePlacementCells = [];
    }

    private clearActiveCursor() {
        if (!this.activeCursor) return;
        this.activeCursor.classList.remove(HIGHLIGHT_CURSOR);
        this.activeCursor = null;
        this.clearFocus();
    }

    private clearAllAnimations() {
        for (const row of this.fillGrid) {
            for (const fill of row) {
                if (!fill) continue;
                this.clearAnimationClasses(fill);
            }
        }
    }
    
    private clearAnimations(elements: HTMLElement[]) {
        elements.forEach(element => this.clearAnimationClasses(element));
    }

    private clearAnimationClasses(element: HTMLElement) {
        element.classList.remove(ANIMATION_SUCCESS, ANIMATION_ERROR, DIRECTION_REJECTION)
    }

    private initializeBoardHeader(): HTMLParagraphElement {
        const boardWrapper = document.querySelector(".board-wrapper")!;

        const boardHeader = document.createElement("p");
        boardHeader.classList.add("board-header");

        boardHeader.textContent = BOARD_HEADER_DEFAULT;
        boardHeader.title = BOARD_HEADER_DEFAULT;

        boardWrapper.prepend(boardHeader);
        return boardHeader;
    }

    private clearBoardHeader() {
        this.boardHeader.textContent = BOARD_HEADER_DEFAULT;
        this.boardHeader.title = BOARD_HEADER_DEFAULT;
    }
}

export { PuzzleRenderer };

