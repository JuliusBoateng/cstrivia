import {getTableElement, getBoardView, getSolutionView} from "./domLoader.js";
import {BoardDomBuilder} from "./render/boardDomBuilder.js";
import {Direction, BoardView, CoordKey} from "./models/boardView.js";

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement = getTableElement();
    const boardView = getBoardView();
    const solutionView = getSolutionView();

    if (boardView.board.id != solutionView.board_id) {
        throw new Error("SolutionView does not match BoardView")
    }
    console.log(boardView)
    console.log(solutionView)

    new BoardDomBuilder(boardView, tableElement).buildTable();
    // handleEvents(tableElement);
});

// class InputHandler {
//     tableElement: HTMLTableElement
//     session: PuzzleSession;
//     renderer: BoardRenderer;
//     boardView: BoardView;

//     constructor(tableElement: HTMLTableElement, session: PuzzleSession, renderer: BoardRenderer, boardView: BoardView) {
//         this.tableElement = tableElement;
//         this.session = session;
//         this.renderer = renderer;
//         this.boardView = boardView;

//         tableElement.addEventListener("click", this.handleCellClick);
//     }

//     handleCellClick(onclick: MouseEvent) {
//         const target = onclick.target;
   
//         if (!(target instanceof HTMLElement)) {
//             return;
//         }

//         const tdElement = target.closest("td");

//         if (!tdElement || tdElement.classList.contains("block")) {
//             return;
//         }

//         const row = Number(tdElement.dataset.row);
//         const col = Number(tdElement.dataset.col);

//         // this.session.moveTo(row, col)
//         // this.renderer.highlightCursor(row, col)
//     }
// }

class PuzzleSession {
    row: number
    col: number
    direction: Direction
    letters: Map<CoordKey, string> // sparse. only contains cells that are editable

    constructor(row: number, col: number) {
        this.row = row
        this.col = col
        
        this.direction = Direction.A
        this.letters = new Map();
    }

    moveCell(row: number, col: number) {
        this.row = row
        this.col = col
    }

    toggleDirection() {
        this.direction = this.direction === Direction.A ? Direction.D : Direction.A;
    }

    setLetter(row: number, col: number, letter: string) {
        const key = BoardView.createCoordKey(row, col)
        this.letters.set(key, letter)
    }
}

// class BoardRenderer {
//     private table: HTMLTableElement
//     private cellMap: Map<string, HTMLInputElement> // dense. contain all cells including cells that are not-editable.

//     constructor(table: HTMLTableElement) {
//         this.table = table
//         this.cellMap = new Map()
//     }

//     moveCell(row: number, col: number) {
//         // move cell
//     }

//     highlightPlacement(placementId: number) {
//         // highlight the word
//     }

//     setLetter(row: number, col: number, letter: string) {
//         const cell = this.cellMap.get(`${row},${col}`)
//         if (cell) cell.value = letter
//     }

//     highlightCell(row:number, col:number) {
//         const cell = this.cellMap.get(`${row},${col}`)
//         cell?.classList.add("active")
//     }

//     highlightCursor(row: number, col: number) {
//         this.clearCursor();
//         const input = this.cellMap.get(`${row},${col}`);
//         input?.classList.add("cursor");
//     }
    
//     highlightPlacement(placementId: number) {
//         const cells = this.placementCells.get(placementId);
//         cells?.forEach(cell => cell.classList.add("active"));
//     }
// }