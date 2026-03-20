import { ClueView } from "../clue/clueRenderer.js";
import { BoardView, Coord, Direction, PlacementId } from "../models/boardView.js";
import { PuzzleRenderer } from "./puzzleRenderer.js";
import { PuzzleSession } from "./puzzleSession.js";
import { PuzzleValidator } from "./puzzleValidator.js";

interface CursorController {
    setCursorByPlacement(placementId: PlacementId): void;
  }

function hasSetDifference<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return true;
  
    const setB = new Set(b);
  
    for (const item of a) {
      if (!setB.has(item)) return true;
    }
  
    return false;
  }
  
const BLOCK = "block";

const NullClueView: ClueView = {
      highlightClue(_placementId: PlacementId): void {},
      renderClues(_solved: PlacementId[]): void {}
  };

class PuzzleController implements CursorController {
    private session: PuzzleSession;
    private renderer: PuzzleRenderer;
    private clueView: ClueView;
    private boardView: BoardView;
    private hasShownInitialFocus;
    private tableElement: HTMLTableElement;
    
    // keydown is the primary input handler.
    // beforeinput is secondary.
    // sometimes both events are triggered at the same time.
    private suppressNextBeforeInput: boolean;

    constructor(tableElement: HTMLTableElement, session: PuzzleSession, renderer: PuzzleRenderer, boardView: BoardView) {
        this.tableElement = tableElement;
        this.session = session;
        this.renderer = renderer;
        this.boardView = boardView;
        this.clueView = NullClueView;
        this.hasShownInitialFocus = false;
        this.suppressNextBeforeInput = false;
    }

    public init(clueView: ClueView) {
        this.setClueView(clueView)
        this.updateCursorVisuals(false);
        this.animateStartingCell()

        this.tableElement.addEventListener("pointerdown", this.handlePointerInput);
        this.tableElement.addEventListener("beforeinput", this.handleBeforeInput);
        this.tableElement.addEventListener("keydown", this.handleKeydown);
    }

    private setClueView(clueView: ClueView) {
        this.clueView = clueView;
        const placement_id = this.session.getActivePlacement().id;
        this.clueView.highlightClue(placement_id);

        const currSolved = [...this.session.getSolvedPlacementIds()];
        this.clueView.renderClues(currSolved);
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
            const hasChanged = this.session.toggleDirection();

            if (!(hasChanged)) {
                const placementId = this.session.getActivePlacement().id;
                const coords = this.session.getPlacementCells(placementId);
                this.renderer.renderDirectionRejection(coords)
            }
        }
        
        const newCoord = {row, col};
        this.session.moveCursor(newCoord)
        this.updateCursorVisuals()
    }

    private handleBeforeInput = (event: InputEvent) => {
        if (this.suppressNextBeforeInput) {
            this.suppressNextBeforeInput = false;
            event.preventDefault();
            return;
        }

        if (event.inputType === "insertText" && event.data && this.isAllowedCharacter(event.data)) {
            event.preventDefault();
            this.commitChar(event.data);
            return;
        }
    
        if (event.inputType === "deleteContentBackward") {
            event.preventDefault();
            this.commitBackDelete();
            return;
        }
    
        if (event.inputType === "deleteContentForward") {
            event.preventDefault();
            this.commitForwardDelete();
            return;
        }
    }

    private handleKeydown = (event: KeyboardEvent) => {        
        if (this.isModifierKey(event)) {
            return;
        }

        if (this.isTypingKey(event)) {
            event.preventDefault();
            this.suppressNextBeforeInput = true;
            this.commitChar(event.key);
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

    private handleTabInput(event: KeyboardEvent) {
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
    
        if (event.key === "Backspace") {
            this.commitBackDelete();
            return;
        }
    
        if (event.key === "Delete") {
            this.commitForwardDelete();
            return;
        }
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

    private isAllowedCharacter(value: string) {
        return value.length === 1 && PuzzleValidator.isLetterOrDigit(value);
    }

    private isTypingKey(event: KeyboardEvent) {
        return event.key.length === 1 && PuzzleValidator.isLetterOrDigit(event.key);
    }

    private isModifierKey(event: KeyboardEvent) {
        return (event.ctrlKey || event.metaKey || event.altKey);
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

    private applyLetter(letter: string | null) {
        const prevSolved = [...this.session.getSolvedPlacementIds()];
        this.session.setLetter(letter);

        const currCoord = this.session.getCoord();
        const currentLetter = this.session.getLetter();
        this.renderer.renderLetter(currCoord, currentLetter);
        
        if (currentLetter) this.renderPlacementFeedback(currCoord);

        const currSolved = [...this.session.getSolvedPlacementIds()];
        if (hasSetDifference(prevSolved, currSolved)) {
            this.clueView.renderClues(currSolved);
        }
    }

    private commitChar(rawChar: string) {
        if (!this.isAllowedCharacter(rawChar)) return;

        const normalized = rawChar.toUpperCase();
        this.applyLetter(normalized);
    
        if (this.session.isPuzzleComplete()) {
            const playableCells = this.session.getPlayableCells();
            this.renderer.markPuzzleComplete(playableCells);
        }
    
        this.session.advanceCursor();
        this.updateCursorVisuals();
    }

    private commitBackDelete() {
        if (this.session.isCellEmpty()) {
            this.session.reverseCursor();
            this.updateCursorVisuals();
            return;
        }
    
        this.applyLetter(null);
    }

    private commitForwardDelete() {
        this.applyLetter(null);
    }

    private updateCursorVisuals(focus: boolean = true) {
        const placement = this.session.getActivePlacement();
        const placementCoords = this.session.getActivePlacementCoords();    
        this.renderer.setPlacementHighlight(placement.id, placementCoords);

        const coord = this.session.getCoord();
        this.renderer.setCursorHighlight(coord);
        this.clueView.highlightClue(placement.id);
        if (focus) this.renderer.focusCell(coord);
        this.updateBoardHeader();
    }

    private updateBoardHeader() {
        const placement = this.session.getActivePlacement();
        if (!placement) return;

        const coord: Coord = {
            row: placement.start_row,
            col: placement.start_col
        };
        const label = this.boardView.getLabel(coord)
        if (label < 0) return;
        
        const clue = this.boardView.getClue(placement.id);
        if (!clue) return;

        const direction = (clue.direction === Direction.A) ? "Across" : "Down";
        const arrow = (clue.direction === Direction.A )? "→" : "↓";

        const captionText = this.formatBoardHeader(label, direction, arrow, clue.question);
        this.renderer.updateBoardHeader(captionText);
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

    private animateStartingCell() {
        if (this.hasShownInitialFocus) return;
    
        const coord = this.session.getCoord();
        this.renderer.animateStartingCell([coord]);
    
        this.hasShownInitialFocus = true;
    }

    private formatBoardHeader(label: number, direction: string, arrow:string, clue: string) {
        return `${label} ${arrow} ${direction}: ${clue}`;
    }
}

export { CursorController, PuzzleController };

