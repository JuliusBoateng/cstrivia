import {BoardDom} from "../render/boardDomBuilder.js";
import {Direction, Coord} from "../models/boardView.js";
import {PuzzleSession} from "../puzzle/puzzleSession.js";
import {PuzzleRenderer} from "../puzzle/puzzleRenderer.js";

class PuzzleController {
    session: PuzzleSession;
    renderer: PuzzleRenderer;
    boardDom: BoardDom;

    constructor(tableElement: HTMLTableElement, session: PuzzleSession, renderer: PuzzleRenderer, boardDom: BoardDom) {
        this.session = session;
        this.renderer = renderer;
        this.boardDom = boardDom;

        tableElement.addEventListener("pointerdown", this.handlePointerInput.bind(this));
        tableElement.addEventListener("beforeinput", this.handleBeforeInput.bind(this));
        tableElement.addEventListener("keydown", this.handleKeydown.bind(this));
    }

    private handlePointerInput(event: PointerEvent) {
        if (!event.isPrimary) return; // ignore multi-touch / secondary stylus
        if (event.button !== 0) return; // ignore right/middle clicks

        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const tdElement = target.closest("td");

        if (!(tdElement instanceof HTMLTableCellElement)) return;
        if (tdElement.classList.contains("block")) return;

        const row = Number(tdElement.dataset.row);
        const col = Number(tdElement.dataset.col);

        if (Number.isNaN(row) || Number.isNaN(col)) return;

        const coord = this.session.getCoord();
        if (coord.row === row && coord.col === col) {
            this.session.toggleDirection();
        }

        this.session.moveCursor(row, col)
        this.updateCursorVisuals()
    }

    private handleBeforeInput(event: InputEvent) {
        if (this.isCharacterKey(event)) {
            this.handleCharacterInput(event);
        }
    }

    private handleKeydown(event: KeyboardEvent) {        
        if (this.isModifierKey(event)) {
            return;
        }
        
        else if (this.isEnterKey(event)) {
            this.handleEnterInput(event);
        }

        else if (this.isTabKey(event)) {
            this.handleTabInput(event);
        }

        else if (this.isDeleteKey(event)) {
            this.handleDeleteInput(event);
        }
        
        else if (this.isHorizontalArrow(event)) {
            this.handleHorizontalArrowInput(event);
        }
        
        else if (this.isVerticalArrow(event)) {
            this.handleVerticalArrowInput(event);
        }
    }

    private isModifierKey(event: KeyboardEvent) {
        return (event.ctrlKey || event.metaKey || event.altKey);
    }

    private isCharacterKey(event: InputEvent) {
        return (event.data) && (event.data.length === 1);
    }

    private isEnterKey(event: KeyboardEvent) {
        return event.key === "Enter";
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

    private isTabKey(event: KeyboardEvent) {
        return event.key === "Tab";
    }

    private handleCharacterInput(event: InputEvent) {
        event.preventDefault();    
        const coord = this.session.getCoord();

        this.session.setLetter(event.data);

        this.renderer.renderLetter(coord.row, coord.col, this.session.getLetter());
        this.renderPlacementFeedback(coord.row, coord.col);
        
        if (this.session.isPuzzleComplete()) {
            const playableCells = this.session.getPlayableCells();
            this.renderer.markPuzzleComplete(playableCells);
        }

        this.session.advanceCursor();
        this.updateCursorVisuals();
    }

    handleTabInput(event: KeyboardEvent) {
        event.preventDefault();

        const offset = event.shiftKey ? -1 : 1;
        this.session.movePlacementBy(offset);
    
        this.updateCursorVisuals();
    }

    private handleEnterInput(event: KeyboardEvent) {
        if (this.session.isEndOfPlacement() && !event.repeat) {
            const current = this.session.getCoord();
            this.renderPlacementFeedback(current.row, current.col)
        } else {
            this.session.advanceCursor();
            this.updateCursorVisuals();
        }
    }
    
    private handleDeleteInput(event: KeyboardEvent) {
        event.preventDefault();

        if (this.session.isCellEmpty()) {
            this.session.reverseCursor();
            this.updateCursorVisuals();
            return;
        }
        
        this.session.setLetter(null);
        const coords = this.session.getCoord();
        this.renderer.renderLetter(coords.row, coords.col, this.session.getLetter());
    }

    private handleHorizontalArrowInput(event: KeyboardEvent) {
        event.preventDefault();
    
        const delta = event.key === "ArrowLeft" ? -1 : 1;
        this.session.moveCursorRelative(0, delta);
        this.session.setDirection(Direction.A);
    
        this.updateCursorVisuals();
    }
    
    private handleVerticalArrowInput(event: KeyboardEvent) {
        event.preventDefault();

        const delta = event.key === "ArrowUp" ? -1 : 1;
        this.session.moveCursorRelative(delta, 0);
        this.session.setDirection(Direction.D);
    
        this.updateCursorVisuals();
    }

    private updateCursorVisuals() {
        const placement = this.session.getActivePlacement();
        const placementCoords = this.session.getActivePlacementCoords();    
        this.renderer.setPlacementHighlight(placement.id, placementCoords);

        const coords = this.session.getCoord();
        this.renderer.setCursorHighlight(coords.row, coords.col);
        this.renderer.focusCell(coords.row, coords.col);
    }

    private renderPlacementFeedback(row: number, col: number) {
        const result = this.session.evaluateCellPlacements(row, col);

        for (const placementId of result.solved) {
            const coords = this.session.getPlacementCells(placementId);
            this.renderer.markPlacementSolved(coords);
        }
        
        for (const placementId of result.incorrect) {
            const coords = this.session.getPlacementCells(placementId);
            this.renderer.markPlacementIncorrect(coords);
        }
    }
}

export {PuzzleController};
