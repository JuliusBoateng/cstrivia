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

        const session_coords = this.session.getCoords();
        if (session_coords.row === row && session_coords.col === col) {
            this.session.toggleDirection();
        }

        this.session.moveCursor(row, col)
        this.renderer.highlightCell(row, col)
    }

    handleKeydown(event: KeyboardEvent) {
        const key = event.key;
        if (event.ctrlKey || event.metaKey || event.altKey) return; // ignore modifier keys
        const session_coords = this.session.getCoords();

        // Handle char inputs
        if (key.length === 1 && !event.repeat) {
            event.preventDefault();
            this.session.setLetter(key);
            this.renderer.renderLetter(session_coords.row, session_coords.col, this.session.getLetter())
            return;
        }
    
        if (key === "Delete" || key === "Backspace") {
            event.preventDefault();
            this.session.setLetter(null);
            this.renderer.renderLetter(session_coords.row, session_coords.col, this.session.getLetter());
            return;
        }
    
        if (key === "ArrowLeft") {
            event.preventDefault();
            this.session.reverseCursor();
            this.renderer.focusCell(session_coords.row, session_coords.col);
            this.renderer.highlightCell(session_coords.row, session_coords.col)
            return;
        }
    
        if (key === "ArrowRight") {
            event.preventDefault();
            this.session.advanceCursor();
            this.renderer.focusCell(session_coords.row, session_coords.col);
            this.renderer.highlightCell(session_coords.row, session_coords.col)
            return;
        }

        if (key === "ArrowDown") {
            event.preventDefault();
            const sessionActivePlacement = this.session.getActivePlacement();
            if (sessionActivePlacement.direction == Direction.D) {
                this.session.advanceCursor();
                this.renderer.focusCell(session_coords.row, session_coords.col);
                this.renderer.highlightCell(session_coords.row, session_coords.col)
            } else {
                this.session.toggleDirection();
            }

            return;
        }
    }

    private render() {
        const session_coords = this.session.getCoords();
    
        this.renderer.focusCell(session_coords.row, session_coords.col);
        this.renderer.highlightCell(session_coords.row, session_coords.col);
        
        const activePlacement = this.session.getActivePlacement();
        const coords = this.session.getActivePlacementCoords();    
        this.renderer.highlightPlacement(coords);
    }
}

class BoardRenderer {
    cellGrid: HTMLTableCellElement[][];
    inputGrid: HTMLInputElement[][];

    constructor(boardDom: BoardDom) {
        this.cellGrid = boardDom.cellGrid;
        this.inputGrid = boardDom.inputGrid;
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

    highlightCell(row: number, col: number) {
        const cellElement: HTMLTableCellElement = this.cellGrid[row][col];
        if (cellElement.classList.contains("block")) {
            throw Error("Unable to highlight cell.")
        }

        cellElement.classList.add("highlight");
    }

    highlightPlacement(coords: { row: number; col: number }[]) {
       for (const {row, col} of coords) {
            this.highlightCell(row, col)
       }
    }
}
