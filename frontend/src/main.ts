import {getTableElement, getBoardView, getSolutionView} from "./domLoader.js";
import {createBoard, BoardDom} from "./render/boardDomBuilder.js";
import {Direction, BoardView, CoordKey} from "./models/boardView.js";

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement = getTableElement();
    const boardView = getBoardView();
    const solutionView = getSolutionView();

    if (boardView.board.id != solutionView.board_id) {
        throw new Error("SolutionView does not match BoardView")
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

        // tableElement.addEventListener("click", this.handleCellClick);
    }

    handleClick(onclick: MouseEvent) {
        const target = onclick.target;
   
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const tdElement = target.closest("td");

        if (!tdElement || tdElement.classList.contains("block")) {
            return;
        }

        const row = Number(tdElement.dataset.row);
        const col = Number(tdElement.dataset.col);

        this.session.moveCursor(row, col)
        this.renderer.highlightCell(row, col)
    }

    handleDoubleClick() {
        //
    }

    handleLetterInput() {
        //
    }

    handleArrowKey() {
        //
    }

    handleBackspace() {
        //
    }
}

class PuzzleSession {
    row: number
    col: number
    direction: Direction
    letterGrid: string[][]
    boardView: BoardView

    constructor(boardView: BoardView) {
        this.boardView = boardView;
        this.row = 0;
        this.col = 0;
        this.direction = Direction.A
        this.letterGrid = this.createLetterGrid();
    }

    private createLetterGrid() {
        const rows = this.boardView.board.rows;
        const cols = this.boardView.board.cols;
        const letterGrid = Array.from({ length: rows }, () => Array(cols).fill(null))
        return letterGrid;
    }

    moveCursor(row: number, col: number) {
        this.row = row
        this.col = col
    }

    toggleDirection() {
        this.direction = this.direction === Direction.A ? Direction.D : Direction.A;
    }

    isBlock(row: number, col: number): boolean {
        return !this.boardView.cellGrid[row][col]
    }

    getNextCell() {
        //
    }

    getPlacementCells(placement_id: number){
        //
    }


    setLetter(row: number, col: number, letter: string) {
        if (this.isBlock(row, col)) {
            throw Error("Unable to write to block cell.")
        }
        
        this.letterGrid[row][col] = letter;
    }

    getLetter(row: number, col: number) {
        return this.letterGrid[row][col]
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
        const inputElement: HTMLInputElement = this.inputGrid[row][col];
        if (!inputElement) {
            throw Error("Unable to highlight cell.")
        }

        inputElement.classList.add("highlight");
    }

    highlightPlacement(placement_id: number) {
        // highlight the word
    }
}
