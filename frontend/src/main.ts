import {getTableElement, getBoardView, getSolutionView} from "./domLoader.js";
import {createBoard, BoardDom} from "./render/boardDomBuilder.js";
import {BoardView, Direction} from "./models/boardView.js";
import {PuzzleSession} from "./puzzle/puzzleSession.js";

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement = getTableElement();
    const boardView = getBoardView();
    const solutionView = getSolutionView();

    if (boardView.board.id != solutionView.board_id) {
        throw Error("SolutionView does not match BoardView")
    }

    const boardDom: BoardDom = createBoard(boardView, tableElement);
});

class PuzzleController {
    session: PuzzleSession;
    renderer: BoardRenderer;
    boardDom: BoardDom;

    constructor(session: PuzzleSession, renderer: BoardRenderer, boardDom: BoardDom) {
        this.session = session;
        this.renderer = renderer;
        this.boardDom = boardDom;

        boardDom.tableElement.addEventListener("click", this.handleClick.bind(this));
        boardDom.tableElement.addEventListener("keydown", this.handleKeydown.bind(this));

    }

    handleClick(event: MouseEvent) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const tdElement = target.closest("td");
        if (!(tdElement instanceof HTMLTableCellElement)) return;
        if (tdElement.classList.contains("block")) return;

        const row = Number(tdElement.dataset.row);
        const col = Number(tdElement.dataset.col);

        if (Number.isNaN(row) || Number.isNaN(col)) return;

        const coords = this.session.getCoords();
        if (coords.row === row && coords.col === col) {
            this.session.toggleDirection();
        }

        this.session.moveCursor(row, col)
        this.updateCursorVisuals()
    }

    handleKeydown(event: KeyboardEvent) {
        const key = event.key;
        if (event.ctrlKey || event.metaKey || event.altKey) return; // ignore modifier keys

        // Handle char inputs
        if (key.length === 1 && !event.repeat) {
            event.preventDefault();
            this.session.setLetter(key);

            const coords = this.session.getCoords();
            this.renderer.renderLetter(coords.row, coords.col, this.session.getLetter())
            this.session.advanceCursor();
            this.updateCursorVisuals()
            return;
        }
    
        if (key === "Delete" || key === "Backspace") {
            event.preventDefault();
            this.session.setLetter(null);

            const coords = this.session.getCoords();
            this.renderer.renderLetter(coords.row, coords.col, this.session.getLetter());
            return;
        }
    
        if (key === "ArrowLeft" || key === "ArrowRight") {
            event.preventDefault();

            if (key === "ArrowLeft") {
                this.session.reverseCursor();
            } else {
                this.session.advanceCursor();
            }

            this.updateCursorVisuals();
            return;
        }

        if (key === "ArrowUp" || key === "ArrowDown") {
            event.preventDefault();

            const sessionActivePlacement = this.session.getActivePlacement();
            if (sessionActivePlacement.direction !== Direction.D) {
                this.session.toggleDirection();
            } else if (key === "ArrowUp") {
                this.session.reverseCursor();
            } else {
                this.session.advanceCursor();
            }
        
            this.updateCursorVisuals();
            return;
        }
    }

    private updateCursorVisuals() {
        const placementCoords = this.session.getActivePlacementCoords();    
        this.renderer.setPlacementHighlight(placementCoords);

        const coords = this.session.getCoords();
        this.renderer.setCursorHighlight(coords.row, coords.col);
        this.renderer.focusCell(coords.row, coords.col);
    }
}

class BoardRenderer {
    cellGrid: HTMLTableCellElement[][];
    inputGrid: HTMLInputElement[][];
    highlightedPlacement: HTMLTableCellElement[];
    highlightedCursor: HTMLTableCellElement | null = null;

    constructor(boardDom: BoardDom) {
        this.cellGrid = boardDom.cellGrid;
        this.inputGrid = boardDom.inputGrid;
        this.highlightedPlacement = [];
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
        this.clearCursorHighlight();

        const cell = this.cellGrid[row][col];
        if (cell.classList.contains("block")) {
            throw Error("Unable to highlight cursor.");
        }
    
        cell.classList.add("highlight-cursor");
        this.highlightedCursor = cell;
    }

    clearCursorHighlight() {
        if (!this.highlightedCursor) return;

        this.highlightedCursor.classList.remove("highlight-cursor");
        this.highlightedCursor = null;
    }

    setPlacementHighlight(coords: { row: number; col: number }[]) {
        this.clearPlacementHighlight();
    
        for (const { row, col } of coords) {
            const cell = this.cellGrid[row][col];
    
            if (cell.classList.contains("block")) {
                throw Error("Unable to highlight placement.");
            }
    
            cell.classList.add("highlight-word");
            this.highlightedPlacement.push(cell);
        }
    }

    clearPlacementHighlight() {
        for (const cell of this.highlightedPlacement) {
            cell.classList.remove("highlight-word");
        }
        this.highlightedPlacement = [];
    }
}
