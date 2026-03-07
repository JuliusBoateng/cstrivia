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

        // this.session.moveTo(row, col)
        // this.renderer.highlightCursor(row, col)
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

    getPlacementCells(placementId: number){
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
    private readonly boardView: BoardView
    private cellGrid: HTMLTableCellElement[][]

    constructor(boardView: BoardView) {
        this.boardView = boardView;
        this.cellGrid = this.initializeCellGrid();
    }

    initializeCellGrid(): HTMLTableCellElement[][] {
        const rows = this.boardView.board.rows;
        const cols = this.boardView.board.cols;
        return Array.from({ length: rows }, () => Array(cols).fill(null))
    }


    renderLetter(row: number, col: number, letter: string | null) {
        const input = this.cellGrid[row][col].querySelector("input")!
        input.value = letter ?? ""
    }

    focusCell(row: number, col: number) {
        const input = this.cellGrid[row][col].querySelector("input")!
        input.focus()
    }

    highlightCell(row:number, col:number) {
        //
    }

    highlightPlacement(placementId: number) {
        // highlight the word
    }
}
