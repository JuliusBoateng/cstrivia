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
        if (this.isModifierKey(event)) {
            return;
        }
        
        else if (this.isCharacterKey(event)) {
            this.handleCharacterInput(event);
        }
        
        else if (this.isDeleteKey(event)) {
            this.handleDelete(event);
        }
        
        else if (this.isHorizontalArrow(event)) {
            this.handleHorizontalArrow(event);
        }
        
        else if (this.isVerticalArrow(event)) {
            this.handleVerticalArrow(event);
        }
    }

    private isModifierKey(event: KeyboardEvent) {
        return (event.ctrlKey || event.metaKey || event.altKey);
    }

    private isCharacterKey(event: KeyboardEvent) {
        return event.key.length === 1 && !event.repeat;
    }
    
    private isDeleteKey(event: KeyboardEvent) {
        return event.key === "Delete" || event.key === "Backspace";
    }
    
    private isHorizontalArrow(event: KeyboardEvent) {
        return event.key === "ArrowLeft" || event.key === "ArrowRight";
    }
    
    private isVerticalArrow(event: KeyboardEvent) {
        return event.key === "ArrowUp" || event.key === "ArrowDown";
    }

    private handleCharacterInput(event: KeyboardEvent) {
        event.preventDefault();
        this.session.setLetter(event.key);
    
        const coords = this.session.getCoords();
        this.renderer.renderLetter(coords.row, coords.col, this.session.getLetter());
    
        this.session.advanceCursor();
        this.updateCursorVisuals();
    }
    
    private handleDelete(event: KeyboardEvent) {
        event.preventDefault();

        if (this.session.isCellEmpty()) {
            this.session.reverseCursor();
            this.updateCursorVisuals();
            return;
        }
        
        this.session.setLetter(null);
        const coords = this.session.getCoords();
        this.renderer.renderLetter(coords.row, coords.col, this.session.getLetter());
    }

    private handleHorizontalArrow(event: KeyboardEvent) {
        event.preventDefault();
    
        if (event.key === "ArrowLeft") {
            this.session.reverseCursor();
        } else {
            this.session.advanceCursor();
        }
    
        this.updateCursorVisuals();
    }
    
    private handleVerticalArrow(event: KeyboardEvent) {
        event.preventDefault();
    
        const activePlacement = this.session.getActivePlacement();
        if (activePlacement.direction !== Direction.D) {
            this.session.toggleDirection();
        } else if (event.key === "ArrowUp") {
            this.session.reverseCursor();
        } else {
            this.session.advanceCursor();
        }
    
        this.updateCursorVisuals();
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
