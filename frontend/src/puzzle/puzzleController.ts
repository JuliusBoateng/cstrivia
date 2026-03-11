import {BoardDom} from "../render/boardDomBuilder.js";
import {Direction} from "../models/boardView.js";
import {PuzzleSession} from "../puzzle/puzzleSession.js";
import {PuzzleRenderer} from "../puzzle/puzzleRenderer.js";

class PuzzleController {
    session: PuzzleSession;
    renderer: PuzzleRenderer;
    boardDom: BoardDom;

    constructor(session: PuzzleSession, renderer: PuzzleRenderer, boardDom: BoardDom) {
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
        const placement = this.session.getActivePlacement();
        const placementCoords = this.session.getActivePlacementCoords();    
        this.renderer.setPlacementHighlight(placement.id, placementCoords);

        const coords = this.session.getCoords();
        this.renderer.setCursorHighlight(coords.row, coords.col);
        this.renderer.focusCell(coords.row, coords.col);
    }
}

export {PuzzleController};
