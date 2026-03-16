import {BoardDom} from "../render/boardDomBuilder.js";
import {Direction, PlacementId} from "../models/boardView.js";
import {PuzzleSession} from "./puzzleSession.js";
import {PuzzleRenderer} from "./puzzleRenderer.js";
import {ClueView} from "./clueRenderer.js";
import {Coord} from "../models/boardView.js";

interface CursorController {
    setCursorByPlacement(placementId: PlacementId): void;
  }

const BLOCK = "block";
const NullClueView: ClueView = {
    highlightClue(_placementId: PlacementId): void {},
    renderClues(_solved: PlacementId[]): void {}
};
  
class PuzzleController implements CursorController {
    private session: PuzzleSession;
    private renderer: PuzzleRenderer;
    private boardDom: BoardDom;
    private clueView: ClueView;

    constructor(tableElement: HTMLTableElement, session: PuzzleSession, renderer: PuzzleRenderer, boardDom: BoardDom) {
        this.session = session;
        this.renderer = renderer;
        this.boardDom = boardDom;
        this.clueView = NullClueView;

        tableElement.addEventListener("pointerdown", this.handlePointerInput);
        tableElement.addEventListener("beforeinput", this.handleBeforeInput);
        tableElement.addEventListener("keydown", this.handleKeydown);
    }

    setClueView(clueView: ClueView) {
        this.clueView = clueView;
      }

    setCursorByPlacement(placementId: PlacementId): void {
        this.session.setCursorByPlacement(placementId);
        this.updateCursorVisuals();
    }
 
    private handlePointerInput = (event: PointerEvent) => {
        if (!event.isPrimary) return; // ignore multi-touch / secondary stylus
        if (event.button !== 0) return; // ignore right/middle clicks

        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const tdElement = target.closest("td");

        if (!(tdElement instanceof HTMLTableCellElement)) return;
        if (tdElement.classList.contains(BLOCK)) return;

        const row = Number(tdElement.dataset.row);
        const col = Number(tdElement.dataset.col);

        if (Number.isNaN(row) || Number.isNaN(col)) return;

        const prevCoord = this.session.getCoord();
        if (prevCoord.row === row && prevCoord.col === col) {
            this.session.toggleDirection();
        }
        
        const newCoord = {row, col};
        this.session.moveCursor(newCoord)
        this.updateCursorVisuals()
    }

    private handleBeforeInput = (event: InputEvent) => {
        if (this.isCharacterKey(event)) {
            this.handleCharacterInput(event);
        }
    }

    private handleKeydown = (event: KeyboardEvent) => {        
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
        
        this.session.setLetter(event.data);
        const coord = this.session.getCoord();
        this.renderer.renderLetter(coord, this.session.getLetter());
        this.renderPlacementFeedback(coord);
        
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
            const coord = this.session.getCoord();
            this.renderPlacementFeedback(coord)
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
        this.renderer.renderLetter(coords, this.session.getLetter());
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

        const coord = this.session.getCoord();
        this.renderer.setCursorHighlight(coord);
        this.clueView.highlightClue(placement.id);
        this.renderer.focusCell(coord);
    }

    private renderPlacementFeedback(coord: Coord) {
        const result = this.session.evaluateCellPlacements(coord);

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

export {PuzzleController, CursorController};
