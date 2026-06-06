import { BoardRefs } from "../board/boardBuilder.js";
import { Coord } from "../app/coords.js";

const ANIMATION_SUCCESS = "placement-success";
const ANIMATION_ERROR = "placement-error";
const HIGHLIGHT_CURSOR = "highlight-cursor";
const HIGHLIGHT_PLACEMENT = "highlight-placement";
const DIRECTION_REJECTION = "direction-reject";
const BLOCK = "block";

class PuzzleRenderer {
  private cellGrid: HTMLTableCellElement[][];
  private fillGrid: (HTMLElement | null)[][];
  private inputGrid: (HTMLInputElement | null)[][];
  private activePlacementId: number;
  private activePlacementCells: HTMLTableCellElement[];
  private activeCursor: HTMLTableCellElement | null;
  private focusedInput: HTMLInputElement | null;

  constructor(boardRefs: BoardRefs) {
    this.cellGrid = boardRefs.cellGrid;
    this.fillGrid = boardRefs.fillGrid;
    this.inputGrid = boardRefs.inputGrid;
    this.activePlacementId = -1;
    this.activePlacementCells = [];
    this.activeCursor = null;
    this.focusedInput = null;
  }

  renderLetter(coord: Coord, letter: string | null): void {
    const inputElement: HTMLInputElement | null = this.inputGrid[coord.row][coord.col];
    if (!inputElement) throw new Error("Input element not found for coord");

    inputElement.value = letter ?? "";
  }

  // Makes the active input tabbable for keyboard navigation without rendering active state or applying DOM focus
  initTabbableCursor(coord: Coord): void {
    const cell = this.cellGrid[coord.row][coord.col];
    if (cell.classList.contains(BLOCK)) return;

    this.clearActiveCursor();
    this.activeCursor = cell;
    // No highlight

    // Does not actually focus
    const inputElement: HTMLInputElement | null = this.inputGrid[coord.row][coord.col];
    if (!inputElement) return;

    inputElement.tabIndex = 0;
    this.focusedInput = inputElement;
  }

  renderActiveCursor(coord: Coord): void {
    const cell = this.cellGrid[coord.row][coord.col];
    if (cell.classList.contains(BLOCK)) return;
    if (this.activeCursor === cell && cell.classList.contains(HIGHLIGHT_CURSOR)) return;

    this.clearActiveCursor();
    cell.classList.add(HIGHLIGHT_CURSOR);
    this.activeCursor = cell;
  }

  renderActivePlacement(placementId: number, coords: Coord[]): void {
    if (this.activePlacementId === placementId) return;
    this.clearActivePlacement();

    const cells: HTMLTableCellElement[] = [];
    for (const { row, col } of coords) {
      const cell = this.cellGrid[row][col];
      if (cell.classList.contains(BLOCK)) return;

      cell.classList.add(HIGHLIGHT_PLACEMENT);
      cells.push(cell);
    }
    this.activePlacementCells = cells;
    this.activePlacementId = placementId;
  }

  clearRenderer(): void {
    this.clearAllAnimations();
    this.clearInput();
    this.clearActiveCursor();
    this.clearFocus();
    this.clearActivePlacement();
  }

  renderDirectionRejection(coords: Coord[]): void {
    const className = DIRECTION_REJECTION;
    const fillElements = this.getFillFromCoords(coords);
    this.animateElements(fillElements, className);
  }

  renderPlacementSolved(coords: Coord[]): void {
    const className = ANIMATION_SUCCESS;
    const fillElements = this.getFillFromCoords(coords);
    this.animateElements(fillElements, className);
  }

  renderPlacementIncorrect(coords: Coord[]): void {
    const className = ANIMATION_ERROR;
    const fillElements = this.getFillFromCoords(coords);
    this.animateElements(fillElements, className);
  }

  renderPuzzleComplete(playableCells: Coord[]): void {
    const fillElements = this.getFillFromCoords(playableCells);
    this.animateElements(fillElements, ANIMATION_SUCCESS);
  }

  private animateElements(elements: HTMLElement[], className: string): void {
    this.clearAnimations(elements);

    // Double requestAnimationFrame ensures the browser processes the class
    // removal in a separate frame before re-adding it. Otherwise the DOM
    // changes may be batched together and the animation will not restart.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        elements.forEach((element) => element.classList.add(className));
      });
    });
  }

  private getFillFromCoords(coords: Coord[]): HTMLElement[] {
    const fills: HTMLElement[] = [];

    for (const coord of coords) {
      const fill = this.fillGrid[coord.row][coord.col];
      if (fill !== null) fills.push(fill);
    }

    return fills;
  }

  setFocus(coord: Coord): void {
    const inputElement = this.inputGrid[coord.row][coord.col];
    if (!inputElement) return;

    if (this.focusedInput && this.focusedInput !== inputElement) {
      this.clearTrackedFocus();
    }

    inputElement.tabIndex = 0;

    if (document.activeElement !== inputElement) {
      inputElement.focus({ preventScroll: true });
    }

    // set range only if focus succeeds
    if (document.activeElement === inputElement) {
      inputElement.setSelectionRange(0, 1);
    }

    this.focusedInput = inputElement;
  }

  // force a real focus transition so mobile browsers reopen keyboard / scroll again
  refocus(coord: Coord): void {
    const inputElement = this.inputGrid[coord.row][coord.col];
    if (!inputElement) return;

    if (this.focusedInput && this.focusedInput !== inputElement) {
      this.clearTrackedFocus();
    }

    inputElement.tabIndex = 0;

    if (document.activeElement === inputElement) {
      inputElement.blur();
    }

    inputElement.focus({ preventScroll: true });

    if (document.activeElement === inputElement) {
      inputElement.setSelectionRange(0, 1);
    }

    this.focusedInput = inputElement;
  }

  // fully exits board focus
  private clearFocus(): void {
    if (!this.focusedInput) return;

    this.focusedInput.tabIndex = -1;
    this.focusedInput.blur();
    this.focusedInput = null;
  }

  // clears input without changing browser focus
  private clearTrackedFocus(): void {
    if (!this.focusedInput) return;

    this.focusedInput.tabIndex = -1;
    this.focusedInput = null;
  }

  private clearInput(): void {
    for (const row of this.inputGrid) {
      for (const inputElement of row) {
        if (!inputElement) continue;
        inputElement.value = "";
      }
    }
  }

  private clearActivePlacement(): void {
    for (const cell of this.activePlacementCells) {
      cell.classList.remove(HIGHLIGHT_PLACEMENT);
    }
    this.activePlacementId = -1;
    this.activePlacementCells = [];
  }

  private clearActiveCursor(): void {
    if (!this.activeCursor) return;
    this.activeCursor.classList.remove(HIGHLIGHT_CURSOR);
    this.activeCursor = null;
  }

  private clearAllAnimations(): void {
    for (const row of this.fillGrid) {
      for (const fill of row) {
        if (!fill) continue;
        this.clearAnimationClasses(fill);
      }
    }
  }

  private clearAnimations(elements: HTMLElement[]): void {
    elements.forEach((element) => this.clearAnimationClasses(element));
  }

  private clearAnimationClasses(element: HTMLElement): void {
    element.classList.remove(ANIMATION_SUCCESS, ANIMATION_ERROR, DIRECTION_REJECTION);
  }
}

export { PuzzleRenderer };
