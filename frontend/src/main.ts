import {getTableElement, getBoardView, getSolutionView} from "./domLoader.js";
import {createBoard, BoardDom} from "./render/boardDomBuilder.js";
import {BoardView} from "./models/boardView.js";
import { PuzzleSession } from "./puzzle/PuzzleSession.js";

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
    boardView: BoardView;
    boardDom: BoardDom;

    constructor(session: PuzzleSession, renderer: BoardRenderer, boardView: BoardView, boardDom: BoardDom) {
        this.session = session;
        this.renderer = renderer;
        this.boardView = boardView;
        this.boardDom = boardDom;

        boardDom.tableElement.addEventListener("click", this.handleClick);
        boardDom.tableElement.addEventListener("keydown", this.handleKeydown);

    }

    handleClick(event: MouseEvent) {
        const target = event.target;
   
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const tdElement = target.closest("td");
        if (!(tdElement instanceof HTMLTableCellElement)) return;

        if (tdElement.classList.contains("block")) {
            return;
        }

        const row = Number(tdElement.dataset.row);
        const col = Number(tdElement.dataset.col);

        if (Number.isNaN(row) || Number.isNaN(col)) {
            return;
        }

        if (this.session.row === row && this.session.col === col) {
            this.session.toggleDirection();
        }

        this.session.moveCursor(row, col)
        this.renderer.highlightCell(row, col)
    }

    handleKeydown(event: KeyboardEvent) {
        const key = event.key;

        // ignore modifier keys
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        
        // Handle char inputs
        if (key.length === 1) {
            this.handleLetter(key);
            return;
        }

        if (key === "Backspace") {
            // this.handleBackspace();
            return;
        }
    
        if (key === "Delete") {
            // this.handleDelete();
            return;
        }
    
        if (key === "ArrowLeft") {
            // this.handleArrowLeft();
            return;
        }
    
        if (key === "ArrowRight") {
            // this.handleArrowRight();
            return;
        }
    }

    private handleLetter(key: string) {
        // const value = input.value;
        // this.setLetter(value === "" ? null : value);

        // this.session.setLetter()
    }

    private handleArrowKey() {
        //
    }

    private handleBackspace() {
        //
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
            throw Error("Unable to write to focus cell.")
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

    highlightPlacement(cellElements: HTMLTableCellElement[]) {
       for (const cellElement of cellElements) {
            cellElement.classList.add("highlight");
       }
    }
}
