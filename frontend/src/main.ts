import {getTableElement, getBoardView, getSolutionView} from "./domLoader.js";
import {createBoard, BoardDom} from "./render/boardDomBuilder.js";
import {Direction, Placement, BoardView, CoordKey} from "./models/boardView.js";

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
        this.session.setLetter()
    }

    private handleArrowKey() {
        //
    }

    private handleBackspace() {
        //
    }
}

class PuzzleSession {
    row: number
    col: number
    rows: number
    cols: number
    activePlacement: Placement
    activePlacementIndex: number;
    // currentWordLength: Map<Placement, number>,
    letterGrid: (string | null)[][]
    boardView: BoardView


    constructor(boardView: BoardView) {
        this.boardView = boardView;
        this.rows = this.boardView.board.rows;
        this.cols = this.boardView.board.cols;

        // start cursor on first placement
        this.activePlacement = this.boardView.getPlacements()[0];
        this.activePlacementIndex = 0;
        this.row = this.activePlacement.start_row;
        this.col = this.activePlacement.start_col;
        // this.currentWordLength = 

        this.letterGrid = this.createLetterGrid();
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

    moveCursor(row: number, col: number) {
        const cell = this.boardView.getCell(row, col);
        if (!cell) return;
    
        this.row = row;
        this.col = col;
    
        let direction = this.activePlacement.direction;
        let position = cell.placement_positions[direction];

        if (!position) {
            direction = direction === Direction.A ? Direction.D : Direction.A;
            position = cell.placement_positions[direction];
        }

        if (!position) return;

        const placement = this.boardView.getPlacement(position.placement_id);
        if (!placement) return;
    
        this.activePlacement = placement;    
        this.activePlacementIndex = position.placement_index;
    }

    toggleDirection() {
        const cell = this.boardView.getCell(this.row, this.col)
        if (!cell) return;

        const currentDirection = this.activePlacement.direction;
        const newDirection: Direction = currentDirection === Direction.A ? Direction.D : Direction.A;
        
        const position = cell.placement_positions[newDirection];
        if (!position) return; // no crossing word

        const placement = this.boardView.getPlacement(position.placement_id);
        if (!placement) return;

        this.activePlacement = placement;
        this.activePlacementIndex = position.placement_index;
    }

    setLetter(letter: string | null) {
        if (this.isBlock()) {
            throw Error("Unable to write to block cell.")
        }
        
        if (letter !== null) {
            if (letter.length !== 1) {
                throw new Error("Letter must be a single character.");
            }
            letter = letter.toUpperCase();
        }

        this.letterGrid[this.row][this.col] = letter
    }

    getLetter(): string | null {
        return this.letterGrid[this.row][this.col]
    }

    // isWordComplete(): boolean {
    //     const placement = this.activePlacement;

    // }

    private createLetterGrid() {
        const letterGrid = Array.from({length: this.rows}, () => Array(this.cols).fill(null))
        return letterGrid;
    }

    private getNextCell(): {row: number; col: number} | null {
        const nextIndex = this.activePlacementIndex + 1;
        if (nextIndex >= this.activePlacement.length) return null;
    
        const cells = this.boardView.getCellsWithPlacementId(this.activePlacement.id);
        if (!cells) return null;

        const nextCell = cells[nextIndex]; // cells are sorted
        return {row: nextCell.row, col: nextCell.col};
    }

    private getPreviousCell(): {row: number; col: number} | null {
        const previousIndex = this.activePlacementIndex - 1;
        if (previousIndex < 0) return null;
    
        const cells = this.boardView.getCellsWithPlacementId(this.activePlacement.id);
        if (!cells) return null;

        const previousCell = cells[previousIndex]; // cells are sorted
        return {row: previousCell.row, col: previousCell.col};
    }

    private isBlock(): boolean {
        return this.boardView.getCell(this.row, this.col) == null;
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
