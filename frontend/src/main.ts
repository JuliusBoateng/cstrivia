import {getTableElement, getBoardView, getSolutionView} from "./domLoader.js";
import {createBoard, BoardDom} from "./render/boardDomBuilder.js";
import {Direction, Placement, BoardView, CoordKey} from "./models/boardView.js";

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
    activePlacement: Placement
    activePlacementIndex: number;
    letterGrid: string[][]
    boardView: BoardView

    constructor(boardView: BoardView) {
        this.boardView = boardView;

        // start cursor on first placement
        this.activePlacement = this.boardView.getPlacements()[0];
        this.activePlacementIndex = 0;
        this.row = this.activePlacement.start_row;
        this.col = this.activePlacement.start_col;

        this.letterGrid = this.createLetterGrid();
    }

    private createLetterGrid() {
        const rows = this.boardView.board.rows;
        const cols = this.boardView.board.cols;
        const letterGrid = Array.from({ length: rows }, () => Array(cols).fill(null))
        return letterGrid;
    }

    advanceCursor() {
        const next = this.getNextCell();
        if (!next) return;
    
        this.moveCursor(next.row, next.col);
    }

    reverseCursor() {
        const previous = this.getPreviousCell();
        if (!previous) return;
    
        this.moveCursor(previous.row, previous.col);
    }

    // TODO review more closely
    moveCursor(row: number, col: number) {
        const cell = this.boardView.getCell(row, col);
        if (!cell) return;
    
        this.row = row;
        this.col = col;
    
        let direction = this.activePlacement.direction;
        let placementId = cell.placements[direction];
    
        // if no placement in current direction, switch
        if (placementId == null) {
            direction = direction === Direction.A ? Direction.D : Direction.A;
            placementId = cell.placements[direction];
        }
    
        if (placementId == null) return;
    
        const placement = this.boardView.getPlacement(placementId);
        if (!placement) return;
    
        this.activePlacement = placement;
    
        const cells = this.boardView.getCellsWithPlacementId(placementId);
        if (!cells) return;
    
        this.activePlacementIndex = cells.findIndex(c => c === cell);
    }

    // TODO Look more closely
    toggleDirection() {
        const newDirection: Direction = this.activePlacement.direction === Direction.A ? Direction.D : Direction.A;
        const currentCell = this.boardView.getCell(this.row, this.col)
        if (!currentCell) return;

        const placement_id = currentCell.placements[newDirection];
        if (placement_id == null) return;

        const placement = this.boardView.getPlacement(placement_id);
        if (!placement) return;

        this.activePlacement = placement;

        const cells = this.boardView.getCellsWithPlacementId(placement_id);
        if (!cells) return;
    
        this.activePlacementIndex = cells.findIndex(c => c === currentCell);
    }

    isBlock(row: number, col: number): boolean {
        return this.boardView.getCell(row, col) == null;
    }

    // TODO Look more closely
    private getNextCell(): {row: number, col: number} | null {
        const cells = this.boardView.getCellsWithPlacementId(this.activePlacement.id);
        if (!cells) return null;
    
        const nextIndex = this.activePlacementIndex + 1;
    
        if (nextIndex >= cells.length) return null;
    
        const nextCell = cells[nextIndex]; // cells are sorted
    
        return { row: nextCell.row, col: nextCell.col };
    }

    // TODO Look more closely
    private getPreviousCell(): {row: number, col: number} | null {
        const cells = this.boardView.getCellsWithPlacementId(this.activePlacement.id);
        if (!cells) return null;
    
        const previousIndex = this.activePlacementIndex - 1;
    
        if (previousIndex < 0) return null;
    
        const previousCell = cells[previousIndex]; // cells are sorted
    
        return {row: previousCell.row, col: previousCell.col};
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
