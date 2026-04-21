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
    renderClue(_placementId: PlacementId): void {},
    copyClueText(_placementId: PlacementId): void {}
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

        const solvedPlacements = [...this.session.getSolvedPlacementIds()];
        this.clueView.renderClues(solvedPlacements);
    }

    moveCursorToPlacement(placementId: PlacementId): void {
        this.session.moveCursorToPlacement(placementId);
        this.renderActiveState();
        this.setActiveFocus();
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

        const prevCoord = this.session.getActiveCoord();
        if ((prevCoord.row === row) && (prevCoord.col === col)) {
            const hasChanged = this.toggleDirection();
            if (hasChanged) this.renderActiveState();    
            return;
        }
        
        const newCoord = {row, col};
        this.session.moveCursor(newCoord);
        this.renderActiveState();
        this.setActiveFocus();
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

        else if (this.isShowAnswerShortcut(event)) {
            event.preventDefault();
            this.suppressNextBeforeInput = true;
            this.handleShowAnswerShortcut();
            return;
        }
    
        else if (this.isCopyShortcut(event)) {
            event.preventDefault();
            this.suppressNextBeforeInput = true;
            this.handleCopyClueShortcut();
            return;
        }

        else if (this.isDirectionShortcut(event)) {
            event.preventDefault();
            this.suppressNextBeforeInput = true;
            this.handleDirectionShortcut();
            return;
        }

        else if (this.isTypingKey(event)) {
            event.preventDefault();
            this.suppressNextBeforeInput = true;
            this.commitChar(event.key);
            return;
        }
        
        else if (this.isDeleteKey(event)) {
            event.preventDefault();
            this.suppressNextBeforeInput = true;
            this.handleDeleteInput(event);
            return;
        }

        else if (this.isEnterKey(event)) {
            event.preventDefault();
            this.handleEnterInput(event);
            return;
        }

        else if (this.isTabKey(event)) {
            event.preventDefault();
            this.handleTabInput(event);
            return;
        }
        
        else if (this.isEscapeKey(event)) {
            event.preventDefault();
            this.handleEscapeInput();
            return;
        }

        else if (this.isHorizontalArrow(event)) {
            event.preventDefault();
            this.handleHorizontalArrowInput(event);
            return;
        }
        
        else if (this.isVerticalArrow(event)) {
            event.preventDefault();
            this.handleVerticalArrowInput(event);
            return;
        }
    }

    private handleShowAnswerShortcut(): void {
        const placement = this.session.getActivePlacement();
        if (!placement) return;
    
        this.showPlacementSolution(placement.id);
    }
    
    private handleCopyClueShortcut(): void {
        const placement = this.session.getActivePlacement();
        if (!placement) return;
    
        this.clueView.copyClueText(placement.id);
    }

    private handleDirectionShortcut() {    
        const hasChanged = this.toggleDirection();
        if (hasChanged) this.renderActiveState();
    }

    private handleTabInput(event: KeyboardEvent) {
        const offset = event.shiftKey ? -1 : 1;
        this.session.movePlacementBy(offset);
        this.renderActiveState();
        this.setActiveFocus();
    }

    private handleEscapeInput() {    
        this.clueView.focusToggle();
    }

    private handleEnterInput(event: KeyboardEvent) {
        if (this.session.isEndOfPlacement() && !event.repeat) {
            const coord = this.session.getActiveCoord();
            this.renderPlacementFeedback(coord)
            return;
        }

        this.session.advanceCursor();
        this.renderActiveState();
        this.setActiveFocus();
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
        this.renderActiveState();
        this.setActiveFocus();
    }
    
    private handleVerticalArrowInput(event: KeyboardEvent) {
        const delta = event.key === "ArrowUp" ? -1 : 1;
        this.session.moveCursorRelative(delta, 0);
        this.session.setDirection(Direction.D);
        this.renderActiveState();
        this.setActiveFocus();
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

    private isShowAnswerShortcut(event: KeyboardEvent): boolean {
        return event.shiftKey && event.key.toLowerCase() === "s";
    }
    
    private isCopyShortcut(event: KeyboardEvent): boolean {
        return event.shiftKey && event.key.toLowerCase() === "c";
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

    private isDirectionShortcut(event: KeyboardEvent) {
        return event.code === "Space";
    }

    private applyLetter(letter: string | null) {
        const prevSolved = [...this.session.getSolvedPlacementIds()];
        this.session.setLetter(letter);
    
        const coord = this.session.getActiveCoord();
        const currentLetter = this.session.getLetter();
        this.renderer.renderLetter(coord, currentLetter);
        this.renderLetterSideEffects(coord, currentLetter, prevSolved);
    }
    
    private renderLetterSideEffects(coord: Coord, currentLetter: string | null, prevSolved: number[]) {
        if (currentLetter) this.renderPlacementFeedback(coord);
    
        const currSolved = [...this.session.getSolvedPlacementIds()];
        if (hasSetDifference(prevSolved, currSolved)) this.clueView.renderClues(currSolved);
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
        this.renderActiveState();
        this.setActiveFocus();
    }

    private commitBackDelete() {
        if (this.session.isCellEmpty()) {
            this.session.reverseCursor();
            this.renderActiveState();
            this.setActiveFocus();
            return;
        }
    
        this.applyLetter(null);
    }

    private commitForwardDelete() {
        this.applyLetter(null);
    }

    private setActiveFocus() {
        const activeCoord: Coord = this.session.getActiveCoord();
        this.renderer.setFocus(activeCoord);
    }

    private renderActiveState() {
        const placement = this.session.getActivePlacement();
        const placementCoords = this.session.getActivePlacementCoords();    
        this.renderer.renderActivePlacement(placement.id, placementCoords);

        const coord = this.session.getActiveCoord();
        this.renderer.renderActiveCursor(coord);
        this.clueView.renderClue(placement.id);
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
        const coord = this.session.getActiveCoord();
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

