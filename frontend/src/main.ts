import {getTableElement, getBoardView, getSolutionView} from "./domLoader.js";
import {BoardDomBuilder} from "./render/boardDomBuilder.js";
import {Direction, BoardView} from "./models/boardView.js";

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement = getTableElement();
    const boardView = getBoardView();
    const solutionView = getSolutionView();
    console.log(solutionView)

    new BoardDomBuilder(boardView, tableElement).buildTable();
    // handleEvents(tableElement);
});

class InputHandler {
    constructor(
        private session: PuzzleSession,
        private renderer: BoardRenderer,
        private boardView: BoardView
    ) {}

    // handleCellClick(row: number, col: number) {
    //     this.session.moveTo(row, col)

    //     this.renderer.highlightCursor(row, col)
    // }
}


function handleEvents(tableElement: HTMLTableElement) {
    const tbody = tableElement.tBodies[0];

    tbody.addEventListener("click", handleCellClick);
    function handleCellClick(onclick: MouseEvent) {
        const target = onclick.target as HTMLElement
        const tdElement = target.closest("td");

        if (!tdElement || tdElement.classList.contains("block")) {
            return;
        }
    }
}

class PuzzleSession {
    row: number
    col: number
    direction: Direction
    letters: Map<string,string>

    constructor(startRow: number, startCol: number) {
        this.row = startRow
        this.col = startCol
        
        this.direction = Direction.A
        this.letters = new Map();
    }

    moveTo(row: number, col: number) {
        this.row = row
        this.col = col
    }

    toggleDirection() {
        this.direction = this.direction === Direction.A ? Direction.D : Direction.A;
    }

    setLetter(row: number, col: number, letter: string){
        this.letters.set(BoardView.createCoordKey(row, col), letter)
    }
}

class BoardRenderer {
    // highlightCell
    // moveCursor
    // fillLetter
    // highlightPlacement
}