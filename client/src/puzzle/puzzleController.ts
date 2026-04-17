import { ClueView } from "../clue/clueRenderer.js";
import { BoardView, Coord, Direction, PlacementId } from "../models/boardView.js";
import { PuzzleRenderer } from "./puzzleRenderer.js";
import { PuzzleSession } from "./puzzleSession.js";
import { PuzzleValidator } from "./puzzleValidator.js";

interface CursorController {
    moveCursorToPlacement(placementId: PlacementId): void;
    showPlacementSolution(placementId: PlacementId): void;
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
    focusToggle(): void {},
    renderClues(_solved: PlacementId[]): void {},
    clearClues(): void {},
    renderActiveClue(_placementId: PlacementId): void {},
};

class PuzzleController implements CursorController {
    private session: PuzzleSession;
    private renderer: PuzzleRenderer;
    private clueView: ClueView;
    private boardView: BoardView;
    private tableElement: HTMLTableElement;
    
    /*  keydown is the primary input handler.
        beforeinput is secondary.
        sometimes both events are triggered at the same time.
    */
    private suppressNextBeforeInput: boolean;

    constructor(tableElement: HTMLTableElement, session: PuzzleSession, renderer: PuzzleRenderer, boardView: BoardView) {
        this.tableElement = tableElement;
        this.session = session;
        this.renderer = renderer;
        this.boardView = boardView;
        this.clueView = NullClueView;
        this.suppressNextBeforeInput = false;
    }

    public init(clueView: ClueView) {
        this.setClueView(clueView)
        this.renderInitialState();

        this.tableElement.addEventListener("focus", this.handleFocus, true);
        this.tableElement.addEventListener("pointerdown", this.handlePointerInput);
        this.tableElement.addEventListener("beforeinput", this.handleBeforeInput);
        this.tableElement.addEventListener("keydown", this.handleKeydown);
    }

    private renderInitialState(): void {
        this.initLetters();
        this.initClues();
        this.initActiveCursor();
    }

    resetPuzzle() {
        this.session.clearPuzzleSession();
        this.renderer.clearRenderer();
        this.clueView.clearClues();
    }

    showPlacementSolution(placementId: PlacementId): void {
        this.session.moveCursorToPlacement(placementId);
        const updatedCoords = this.session.applyPlacementSolution(placementId);

        for (const coord of updatedCoords) {            
            const letter = this.session.getLetterAt(coord);
            this.renderer.renderLetter(coord, letter);
        }

        this.renderCursorVisuals();

        const solvedPlacements = [...this.session.getSolvedPlacementIds()];
        this.clueView.renderClues(solvedPlacements);
    }

    moveCursorToPlacement(placementId: PlacementId): void {
        this.session.moveCursorToPlacement(placementId);
        this.renderCursorVisuals();
    }

    private handleFocus = (event: FocusEvent) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
      
        this.renderCursorVisuals();
      };

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
            this.toggleDirection();
        }
        
        const newCoord = {row, col};
        this.session.moveCursor(newCoord)
        this.renderCursorVisuals()
    }

    private handleBeforeInput = (event: InputEvent) => {
        if (this.suppressNextBeforeInput) {
            this.suppressNextBeforeInput = false;
            event.preventDefault();
            return;
        }

        if (event.inputType === "insertText") {
            event.preventDefault();
    
            if (event.data && this.isAllowedCharacter(event.data)) {
                this.commitChar(event.data);
            }
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

        if (this.isSpace(event)) {
            event.preventDefault();
            this.suppressNextBeforeInput = true;
            this.handleSpacebar();
            return;
        }

        if (this.isTypingKey(event)) {
            event.preventDefault();
            this.suppressNextBeforeInput = true;
            this.commitChar(event.key);
            return;
        }
        
        else if (this.isDeleteKey(event)) {
            event.preventDefault();
            this.suppressNextBeforeInput = true;
            this.handleDeleteInput(event);
        }

        else if (this.isEnterKey(event)) {
            event.preventDefault();
            this.handleEnterInput(event);
        }

        else if (this.isTabKey(event)) {
            event.preventDefault();
            this.handleTabInput(event);
        }
        
        else if (this.isEscapeKey(event)) {
            event.preventDefault();
            this.handleEscapeInput();
        }

        else if (this.isHorizontalArrow(event)) {
            event.preventDefault();
            this.handleHorizontalArrowInput(event);
        }
        
        else if (this.isVerticalArrow(event)) {
            event.preventDefault();
            this.handleVerticalArrowInput(event);
        }
    }

    private handleSpacebar() {    
        const hasChanged = this.toggleDirection();
        if (hasChanged) this.renderCursorVisuals();
    }

    private handleTabInput(event: KeyboardEvent) {
        const offset = event.shiftKey ? -1 : 1;
        this.session.movePlacementBy(offset);
    
        this.renderCursorVisuals();
    }

    private handleEscapeInput() {    
        this.clueView.focusToggle();
    }

    private handleEnterInput(event: KeyboardEvent) {
        if (this.session.isEndOfPlacement() && !event.repeat) {
            const coord = this.session.getCoord();
            this.renderPlacementFeedback(coord)
        } else {
            this.session.advanceCursor();
            this.renderCursorVisuals();
        }
    }
    
    private handleDeleteInput(event: KeyboardEvent) {    
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
        const delta = event.key === "ArrowLeft" ? -1 : 1;
        this.session.moveCursorRelative(0, delta);
        this.session.setDirection(Direction.A);
    
        this.renderCursorVisuals();
    }
    
    private handleVerticalArrowInput(event: KeyboardEvent) {
        const delta = event.key === "ArrowUp" ? -1 : 1;
        this.session.moveCursorRelative(delta, 0);
        this.session.setDirection(Direction.D);
    
        this.renderCursorVisuals();
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

    private isEscapeKey(event: KeyboardEvent): boolean {
        return event.key === "Escape";
    }

    private isSpace(event: KeyboardEvent) {
        return event.code === "Space";
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
            this.renderer.renderPuzzleComplete(playableCells);
        }
    
        this.session.advanceCursor();
        this.renderCursorVisuals();
    }

    private commitBackDelete() {
        if (this.session.isCellEmpty()) {
            this.session.reverseCursor();
            this.renderCursorVisuals();
            return;
        }
    
        this.applyLetter(null);
    }

    private commitForwardDelete() {
        this.applyLetter(null);
    }

    private renderCursorVisuals() {
        const placement = this.session.getActivePlacement();
        const placementCoords = this.session.getActivePlacementCoords();    
        this.renderer.renderActivePlacement(placement.id, placementCoords);

        const coord = this.session.getCoord();
        this.renderer.renderActiveCursor(coord);
        this.clueView.renderActiveClue(placement.id);
        this.renderBoardHeader();
    }

    private renderBoardHeader() {
        if (this.session.isPuzzleComplete()) {
            this.renderPuzzleCompleteHeader();
            return;
        }

        this.renderStandardHeader();
    }

    private renderPuzzleCompleteHeader() {
        const captionText = "Puzzle Complete. Good work.";
        this.renderer.renderBoardHeader(captionText);
    }

    private renderStandardHeader() {
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
        const arrow = (clue.direction === Direction.A ) ? "\u2192" : "\u2193";

        const captionText = this.formatBoardHeader(label, direction, arrow, clue.question);
        this.renderer.renderBoardHeader(captionText);
    }

    private renderPlacementFeedback(coord: Coord) {
        const result = this.session.getPlacementResults(coord);

        for (const placementId of result.solved) {
            const coords = this.session.getPlacementCells(placementId);
            this.renderer.renderPlacementSolved(coords);
        }
        
        for (const placementId of result.incorrect) {
            const coords = this.session.getPlacementCells(placementId);
            this.renderer.renderPlacementIncorrect(coords);
        }
    }

    private toggleDirection(): boolean {
        const hasChanged = this.session.toggleDirection();
        
        if (!hasChanged) {
            const activePlacement = this.session.getActivePlacement().id;
            const coords = this.session.getPlacementCells(activePlacement);
            this.renderer.renderDirectionRejection(coords)
        }

        return hasChanged;
    }

    private setClueView(clueView: ClueView) {
        this.clueView = clueView;
    }

    private initLetters() {
        for (let row = 0; row < this.boardView.board.rows; row++) {
            for (let col = 0; col < this.boardView.board.cols; col++) {
                const coord: Coord = { row, col };
                if (this.session.isBlock(coord)) continue;

                const letter = this.session.getLetterAt(coord);
                this.renderer.renderLetter(coord, letter);
            }
        }
    }

    private initActiveCursor() {
        const coord = this.session.getCoord();
        this.renderer.initActiveCursor(coord);
    }

    private initClues() {
        const currSolved = [...this.session.getSolvedPlacementIds()];
        this.clueView.renderClues(currSolved);
    }

    private formatBoardHeader(label: number, direction: string, arrow:string, clue: string) {
        return `${label} ${arrow} ${direction}: ${clue}`;
    }
}

export { CursorController, PuzzleController };

