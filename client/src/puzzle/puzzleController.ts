import { isTouchDevice } from "../app/device.js";
import { ClueView } from "../clue/clueRenderer.js";
import { Coord } from "../app/coords.js";
import { BoardView, Direction, Placement, PlacementId } from "../models/boardView.js";
import { PuzzleRenderer } from "./puzzleRenderer.js";
import { PuzzleSession } from "./puzzleSession.js";
import { PuzzleValidator } from "./puzzleValidator.js";

interface CursorController {
  handleClueClick(placementId: PlacementId): void;
  handleShowAnswerClick(placementId: PlacementId): void;
}

function hasDifferentItems<T>(a: T[], b: T[]): boolean {
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
  scrollActiveClue(): void {},
  copyClueText(_placementId: PlacementId): void {},
};

class PuzzleController implements CursorController {
  private session: PuzzleSession;
  private renderer: PuzzleRenderer;
  private clueView: ClueView;
  private boardView: BoardView;
  private tableElement: HTMLTableElement;
  private isActiveStateVisible: boolean = false;

  // Touch-only interaction state. False for exploratory selection, true after direct cell interaction
  private allowTouchDirectionToggle: boolean = false;

  constructor(tableElement: HTMLTableElement, session: PuzzleSession, renderer: PuzzleRenderer, boardView: BoardView) {
    this.tableElement = tableElement;
    this.session = session;
    this.renderer = renderer;
    this.boardView = boardView;
    this.clueView = NullClueView;
  }

  public init(clueView: ClueView): void {
    this.setClueView(clueView);
    this.renderInitialState();

    this.tableElement.addEventListener("pointerdown", this.handlePointerInput);
    this.tableElement.addEventListener("beforeinput", this.handleBeforeInput);
    this.tableElement.addEventListener("keydown", this.handleKeydown);
    this.tableElement.addEventListener("copy", this.handleCopyEvent);
    this.tableElement.addEventListener("paste", this.handlePasteEvent);
    this.tableElement.addEventListener("focusin", this.handleFocusIn);
  }

  resetPuzzle(): void {
    this.session.clearPuzzleSession();
    this.renderer.clearRenderer();
    this.clueView.clearClues();

    this.initInteractionState();
  }

  handleShowAnswerClick(placementId: PlacementId): void {
    this.session.moveCursorToPlacement(placementId);

    const updatedCoords = this.session.applyPlacementSolution(placementId);
    for (const coord of updatedCoords) {
      const letter = this.session.getLetterAt(coord);
      this.renderer.renderLetter(coord, letter);
    }

    this.renderActiveState();
    this.allowTouchDirectionToggle = false;

    // Mobile clue clicks should be exploratory and not shift focus / call keyboard
    if (!isTouchDevice()) {
      this.setActiveFocus();
    }

    const solvedPlacements = [...this.session.getSolvedPlacementIds()];
    this.clueView.renderClues(solvedPlacements);
  }

  handleClueClick(placementId: PlacementId): void {
    this.session.moveCursorToPlacement(placementId);
    this.renderActiveState();
    this.allowTouchDirectionToggle = false;

    // Mobile clue clicks should be exploratory and not shift focus / call keyboard
    if (!isTouchDevice()) {
      this.forceActiveFocus();
    }
  }

  handleMobileNext(): void {
    this.movePlacement(1);
  }

  handleMobilePrev(): void {
    this.movePlacement(-1);
  }

  // reveals active state when keyboard focus enters the board
  private handleFocusIn = () => {
    if (this.isActiveStateVisible) return;
    this.renderActiveState();
    this.clueView.scrollActiveClue();
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

    if (this.handlePointerDirectionToggle(row, col)) return;
    this.allowTouchDirectionToggle = true;

    const newCoord = { row, col };
    this.session.moveCursor(newCoord);
    this.renderActiveState();
    this.clueView.scrollActiveClue();
    this.forceActiveFocus();
  };

  private handlePointerDirectionToggle(row: number, col: number): boolean {
    if (!this.isActiveStateVisible) return false;
    if (this.shouldIgnoreTouchDirectionToggle()) return false;

    const prevCoord = this.session.getActiveCoord();
    if (prevCoord.row === row && prevCoord.col === col) {
      this.toggleDirection();
      this.renderActiveState();
      this.clueView.scrollActiveClue();
      this.forceActiveFocus();
      return true;
    }

    return false;
  }

  // Touch devices separate selection from DOM focus. Ignore direction toggles until the active input is focused.
  private shouldIgnoreTouchDirectionToggle(): boolean {
    return isTouchDevice() && !this.allowTouchDirectionToggle;
  }

  private handleBeforeInput = (event: InputEvent) => {
    if (this.isTextInput(event)) {
      event.preventDefault();
      if (this.isTypingKey(event)) {
        this.commitChar(event.data!);
      }
      return;
    } else if (this.isBackDelete(event)) {
      event.preventDefault();
      this.commitBackDelete();
      return;
    } else if (this.isForwardDelete(event)) {
      event.preventDefault();
      this.commitForwardDelete();
      return;
    }
  };

  private handleKeydown = (event: KeyboardEvent) => {
    if (this.isModifierKey(event)) {
      return;
    }

    // mobile browsers may not emit beforeinput delete events when the focused input is already empty.
    // handle empty-cell backspace here as a fallback.
    if (this.isDeleteKey(event) && this.session.isCellEmpty()) {
      event.preventDefault();
      this.commitBackDelete();
      return;
    }

    // preventDefault prevents the corresponding beforeinput from firing for keyboard shortcuts
    else if (!isTouchDevice() && this.isShowAnswerShortcut(event)) {
      event.preventDefault();
      this.handleShowAnswerShortcut();
      return;
    } else if (!isTouchDevice() && this.isCopyPlacementShortcut(event)) {
      event.preventDefault();
      this.handleCopyPlacementShortcut();
      return;
    } else if (!isTouchDevice() && this.isCopyClueShortcut(event)) {
      event.preventDefault();
      this.handleCopyClueShortcut();
      return;
    } else if (this.isDirectionShortcut(event)) {
      event.preventDefault();
      this.handleDirectionShortcut();
      return;
    } else if (this.isEnterKey(event)) {
      event.preventDefault();
      this.handleEnterInput(event);
      return;
    } else if (this.isTabKey(event)) {
      event.preventDefault();
      this.handleTabInput(event);
      return;
    } else if (this.isEscapeKey(event)) {
      event.preventDefault();
      this.handleEscapeInput();
      return;
    } else if (this.isHorizontalArrow(event)) {
      event.preventDefault();
      this.handleHorizontalArrowInput(event);
      return;
    } else if (this.isVerticalArrow(event)) {
      event.preventDefault();
      this.handleVerticalArrowInput(event);
      return;
    }
  };

  private handleShowAnswerShortcut(): void {
    const placement = this.session.getActivePlacement();
    if (!placement) return;

    this.handleShowAnswerClick(placement.id);
  }

  private handleCopyClueShortcut(): void {
    const placement = this.session.getActivePlacement();
    if (!placement) return;

    this.clueView.copyClueText(placement.id);
  }

  private handleDirectionShortcut(): void {
    if (!this.isActiveStateVisible) {
      this.renderActiveState();
      this.clueView.scrollActiveClue();
      return;
    }

    this.toggleDirection();
    this.renderActiveState();
    this.clueView.scrollActiveClue();
  }

  private handleTabInput(event: KeyboardEvent): void {
    const offset = event.shiftKey ? -1 : 1;
    this.movePlacement(offset);
  }

  private handleEscapeInput(): void {
    this.clueView.focusToggle();
  }

  private handleEnterInput(event: KeyboardEvent): void {
    if (this.session.isEndOfPlacement() && !event.repeat) {
      const coord = this.session.getActiveCoord();
      this.renderPlacementFeedbackForCoord(coord);
      return;
    }

    this.session.advanceCursor();
    this.renderActiveState();
    this.clueView.scrollActiveClue();
    this.setActiveFocus();
  }

  private handleHorizontalArrowInput(event: KeyboardEvent): void {
    const delta = event.key === "ArrowLeft" ? -1 : 1;
    this.session.moveCursorRelative(0, delta);
    this.session.setDirection(Direction.A);
    this.renderActiveState();
    this.clueView.scrollActiveClue();
    this.setActiveFocus();
  }

  private handleVerticalArrowInput(event: KeyboardEvent): void {
    const delta = event.key === "ArrowUp" ? -1 : 1;
    this.session.moveCursorRelative(delta, 0);
    this.session.setDirection(Direction.D);
    this.renderActiveState();
    this.clueView.scrollActiveClue();
    this.setActiveFocus();
  }

  private handleCopyEvent = (event: ClipboardEvent) => {
    const letter = this.session.getLetter();
    if (!event.clipboardData || !letter) return;

    event.preventDefault();

    event.clipboardData.setData("text/plain", letter);
  };

  private async handleCopyPlacementShortcut(): Promise<void> {
    const text = this.getActivePlacementText();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // noop
    }
  }

  private handlePasteEvent = (event: ClipboardEvent) => {
    event.preventDefault();
    if (!event.clipboardData) return;

    const raw = event.clipboardData.getData("text");
    if (!raw) return;

    const normalized = PuzzleValidator.normalizeAnswer(raw);
    if (!normalized) return;

    this.applyPastedText(normalized);
  };

  private isTextInput(event: InputEvent): boolean {
    return event.inputType === "insertText";
  }

  private isTypingKey(event: InputEvent): boolean {
    return event.data !== null && this.isAllowedCharacter(event.data);
  }

  private isBackDelete(event: InputEvent): boolean {
    return event.inputType === "deleteContentBackward";
  }

  private isForwardDelete(event: InputEvent): boolean {
    return event.inputType === "deleteContentForward";
  }

  private isDeleteKey(event: KeyboardEvent): boolean {
    return event.key === "Delete" || event.key === "Backspace";
  }

  private isAllowedCharacter(value: string): boolean {
    return value.length === 1 && PuzzleValidator.isLetterOrDigit(value);
  }

  private isModifierKey(event: KeyboardEvent): boolean {
    return event.ctrlKey || event.metaKey || event.altKey;
  }

  private isShowAnswerShortcut(event: KeyboardEvent): boolean {
    return event.shiftKey && event.key.toLowerCase() === "s";
  }

  private isCopyPlacementShortcut(event: KeyboardEvent): boolean {
    return event.shiftKey && event.key.toLowerCase() === "c";
  }

  private isCopyClueShortcut(event: KeyboardEvent): boolean {
    return event.shiftKey && event.key.toLowerCase() === "k";
  }

  private isEnterKey(event: KeyboardEvent): boolean {
    return event.key === "Enter";
  }

  private isHorizontalArrow(event: KeyboardEvent): boolean {
    return event.key === "ArrowLeft" || event.key === "ArrowRight";
  }

  private isVerticalArrow(event: KeyboardEvent): boolean {
    return event.key === "ArrowUp" || event.key === "ArrowDown";
  }

  private isTabKey(event: KeyboardEvent): boolean {
    return event.key === "Tab";
  }

  private isEscapeKey(event: KeyboardEvent): boolean {
    return event.key === "Escape";
  }

  private isDirectionShortcut(event: KeyboardEvent): boolean {
    return event.code === "Space";
  }

  private applyLetter(letter: string | null): void {
    const prevSolved = [...this.session.getSolvedPlacementIds()];
    this.writeLetter(letter);

    const coord = this.session.getActiveCoord();
    const currentLetter = this.session.getLetter();
    this.applyLetterFeedback(coord, currentLetter, prevSolved);
  }

  private writeLetter(letter: string | null): void {
    this.session.setLetter(letter);

    const coord = this.session.getActiveCoord();
    const currentLetter = this.session.getLetter();
    this.renderer.renderLetter(coord, currentLetter);
  }

  private applyLetterFeedback(coord: Coord, currentLetter: string | null, prevSolved: PlacementId[]): void {
    if (currentLetter) this.renderPlacementFeedbackForCoord(coord);

    const currSolved = [...this.session.getSolvedPlacementIds()];
    if (hasDifferentItems(prevSolved, currSolved)) this.clueView.renderClues(currSolved);
  }

  private applyPastedText(normalized: string): void {
    const prevSolved = [...this.session.getSolvedPlacementIds()];

    const affectedPlacements = this.writePastedText(normalized);
    this.renderPlacementFeedback([...affectedPlacements]);

    const currSolved = [...this.session.getSolvedPlacementIds()];
    if (hasDifferentItems(prevSolved, currSolved)) this.clueView.renderClues(currSolved);

    this.renderActiveState();
    this.clueView.scrollActiveClue();
    this.setActiveFocus();
  }

  private writePastedText(normalized: string): Set<Placement> {
    const affectedPlacements = new Set<Placement>();

    for (const letter of normalized) {
      this.writeLetter(letter);

      const coord = this.session.getActiveCoord();
      const placements = this.session.getPlacements(coord);

      for (const placement of placements) {
        affectedPlacements.add(placement);
      }

      if (!this.session.canAdvanceCursor()) break;
      this.session.advanceCursor();
    }

    return affectedPlacements;
  }

  private getActivePlacementText(): string | null {
    const coords = this.session.getActivePlacementCoords();
    if (!coords) return null;

    const letters: string[] = [];
    for (const coord of coords) {
      const letter = this.session.getLetterAt(coord);
      if (!letter) continue;

      letters.push(letter);
    }

    return letters.join("") || null;
  }

  private commitChar(rawChar: string): void {
    if (!this.isAllowedCharacter(rawChar)) return;

    const normalized = rawChar.toUpperCase();
    this.applyLetter(normalized);

    if (this.session.isPuzzleComplete()) {
      const playableCells = this.session.getPlayableCells();
      this.renderer.renderPuzzleComplete(playableCells);
    }

    this.session.advanceCursor();
    this.renderActiveState();
    this.clueView.scrollActiveClue();
    this.setActiveFocus();
  }

  private commitBackDelete(): void {
    if (this.session.isCellEmpty()) {
      this.session.reverseCursor();
      this.renderActiveState();
      this.clueView.scrollActiveClue();
      this.setActiveFocus();
    }

    this.applyLetter(null);
  }

  private commitForwardDelete(): void {
    this.applyLetter(null);
  }

  private setActiveFocus(): void {
    const activeCoord: Coord = this.session.getActiveCoord();
    this.renderer.setFocus(activeCoord);
  }

  // force focus so mobile keyboards reopen even if the cell is already focused
  private forceActiveFocus(): void {
    const activeCoord: Coord = this.session.getActiveCoord();
    this.renderer.refocus(activeCoord);
  }

  private renderActiveState(): void {
    const placement = this.session.getActivePlacement();
    const placementCoords = this.session.getActivePlacementCoords();
    this.renderer.renderActivePlacement(placement.id, placementCoords);

    const coord = this.session.getActiveCoord();
    this.renderer.renderActiveCursor(coord);
    this.clueView.renderClue(placement.id);

    this.isActiveStateVisible = true;
  }

  private renderPlacementFeedbackForCoord(coord: Coord): void {
    const placements = this.session.getPlacements(coord);
    this.renderPlacementFeedback(placements);
  }

  private renderPlacementFeedback(placements: Placement[]): void {
    const result = this.session.getPlacementResults(placements);

    for (const placementId of result.solved) {
      const coords = this.session.getPlacementCells(placementId);
      this.renderer.renderPlacementSolved(coords);
    }

    for (const placementId of result.incorrect) {
      const coords = this.session.getPlacementCells(placementId);
      this.renderer.renderPlacementIncorrect(coords);
    }
  }

  private movePlacement(offset: number): void {
    this.session.movePlacementBy(offset);
    this.renderActiveState();
    this.clueView.scrollActiveClue();
    this.allowTouchDirectionToggle = false;

    if (!isTouchDevice()) {
      this.setActiveFocus();
    }
  }

  private toggleDirection(): boolean {
    const hasChanged = this.session.toggleDirection();

    if (!hasChanged) {
      const activePlacement = this.session.getActivePlacement().id;
      const coords = this.session.getPlacementCells(activePlacement);
      this.renderer.renderDirectionRejection(coords);
    }

    return hasChanged;
  }

  private setClueView(clueView: ClueView): void {
    this.clueView = clueView;
  }

  private initLetters(): void {
    for (let row = 0; row < this.boardView.board.rows; row++) {
      for (let col = 0; col < this.boardView.board.cols; col++) {
        const coord: Coord = { row, col };
        if (this.session.isBlock(coord)) continue;

        const letter = this.session.getLetterAt(coord);
        this.renderer.renderLetter(coord, letter);
      }
    }
  }

  private renderInitialState(): void {
    this.initPuzzleContent();
    this.initInteractionState();
  }

  private initPuzzleContent(): void {
    this.initLetters();
    this.initClues();
  }

  private initInteractionState(): void {
    if (isTouchDevice()) {
      // Touch devices separate selection from focus
      this.renderActiveState();
    } else {
      this.initTabbableCursor();
      this.isActiveStateVisible = false;
    }
    this.allowTouchDirectionToggle = false;
  }

  // Prepares the active cell for keyboard navigation without visually activating or focusing the input
  private initTabbableCursor(): void {
    const coord = this.session.getActiveCoord();
    this.renderer.initTabbableCursor(coord);
  }

  private initClues(): void {
    const currSolved = [...this.session.getSolvedPlacementIds()];
    this.clueView.renderClues(currSolved);
  }
}

export { CursorController, PuzzleController };
