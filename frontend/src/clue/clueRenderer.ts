import { Direction, PlacementId } from "../models/boardView.js";
import { CursorController } from "../puzzle/puzzleController.js";
import { revealCopyButton, hideCopyButton} from "./clueBuilder.js";

const CLUE_TOGGLE = ".clue-toggle";
const CLUE = ".clue"
const ARIA_CONTROLS = "aria-controls";
const ARIA_EXPANDED = "aria-expanded";
const HIDDEN = "hidden";
const HIGHLIGHT = "highlight";
const TODO_ACROSS_CLUES = "#todo-across-clues";
const TODO_DOWN_CLUES = "#todo-down-clues";
const SOLVED_ACROSS_CLUES = "#solved-across-clues";
const SOLVED_DOWN_CLUES = "#solved-down-clues";
const TODO_ACROSS_TOGGLE = "#todo-across-toggle";
const TODO_DOWN_TOGGLE = "#todo-down-toggle";
const SOLVED_ACROSS_TOGGLE = "#solved-across-toggle";
const SOLVED_DOWN_TOGGLE = "#solved-down-toggle";
const TODO_TOGGLE = "#todo-toggle";
const SOLVED_TOGGLE = "#solved-toggle";
const CLUE_COUNT = ".clue-count";
const TODO_SECTION = "#todo-section";
const SOLVED_SECTION = "#solved-section";

const CLUE_COPY_REVEAL_EVENT = "cluecopyreveal";

type ClueCounts = {todoAcrossCount: number,
          todoDownCount: number,
          solvedAcrossCount: number,
          solvedDownCount: number}

interface ClueView {
  focusToggle(): void;
  renderClues(solved: PlacementId[]): void;
  clearClues(): void;
  renderActiveClue(placementId: PlacementId): void;
}

type ClueElement = {
  liElement: HTMLLIElement;
  copyButton: HTMLButtonElement;
}

const NullCursorController: CursorController = {
  moveCursorToPlacement(_placementId: PlacementId): void {}
};

class ClueRenderer implements ClueView {
    private clueContainer: HTMLDivElement;
    private cursorController: CursorController;
    private placementClueMap: Map<PlacementId, ClueElement>;
    private activeClue: ClueElement | null; 

    private todoAcrossClues!: HTMLOListElement;
    private todoDownClues!: HTMLOListElement;
    private solvedAcrossClues!: HTMLOListElement;
    private solvedDownClues!: HTMLOListElement;

    private todoToggle!: HTMLButtonElement;
    private todoAcrossToggle!: HTMLButtonElement;
    private todoDownToggle!: HTMLButtonElement;

    private solvedToggle!: HTMLButtonElement;
    private solvedAcrossToggle!: HTMLButtonElement;
    private solvedDownToggle!: HTMLButtonElement;

    private todoCountLabel!: HTMLSpanElement;
    private solvedCountLabel!: HTMLSpanElement;
    private todoAcrossCountLabel!: HTMLSpanElement;
    private todoDownCountLabel!: HTMLSpanElement;
    private solvedAcrossCountLabel!: HTMLSpanElement;
    private solvedDownCountLabel!: HTMLSpanElement;

    private todoSection!: HTMLDivElement;
    private solvedSection!: HTMLDivElement;

    private visibleCopyButton: HTMLButtonElement | null = null;

    constructor(clueContainer: HTMLDivElement) {
        this.clueContainer = clueContainer;
        this.cursorController = NullCursorController;
        this.activeClue = null;

        this.placementClueMap = new Map<PlacementId, ClueElement>();
    }

    init(cursorController: CursorController): void {
      this.initClueLists();
      this.initToggles();
      this.initLabels();
      this.initPlacementClues();
      this.initSections();
      this.setCursorController(cursorController);
      
      // Standard event handler
      this.clueContainer.addEventListener("pointerdown", this.handleContainerPointerDown);
      this.clueContainer.addEventListener("click", this.handleContainerClick);
      this.clueContainer.addEventListener("keydown", this.handleContainerKeydown);
      this.clueContainer.addEventListener("mouseleave", this.handleHoverLeave);

      // Custom event handler
      this.clueContainer.addEventListener(CLUE_COPY_REVEAL_EVENT, this.handleCopyReveal as EventListener);
    }

    focusToggle(): void {
      this.todoToggle.focus();
    }

    renderClues(solved: PlacementId[]): void {
      const solvedSet = new Set(solved);
      const clueCounts: ClueCounts = this.renderClueList(solvedSet);
      
      this.renderProgressCount(clueCounts);
      this.renderEmptyState(clueCounts);
      this.renderClueVisibility()
    }

    clearClues(): void {
      const clueCounts: ClueCounts = this.renderClueList(new Set<number>());      
      this.renderProgressCount(clueCounts);
      this.renderEmptyState(clueCounts);

      this.renderClueVisibility()
      this.clearActiveClue();
    }

    renderActiveClue(placementId: PlacementId): void {
      const clueElement = this.placementClueMap.get(placementId);
      if (!clueElement) return;

      this.clearActiveClue();

      this.activeClue = clueElement;
      clueElement.liElement.classList.add(HIGHLIGHT);
      this.scrollClue(clueElement.liElement);

      this.revealCurrentCopyButton(clueElement.copyButton);
    }

    private handleContainerKeydown = (event: KeyboardEvent) => {
      if (this.isActionKey(event)) {
        event.preventDefault();
        this.handleAction(event);
        return;
      }
    }

    /*
      Preserves boad input focus when pressing a clue.
      Without this focus falls to <body>, interrupting input focus.
    */
    private handleContainerPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
    
      const clue = this.getClue(target);
      if (!clue) return;
    
      event.preventDefault();
    };

    private handleContainerClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const toggle = this.getToggle(target);
      if (toggle) {
        this.handleToggle(toggle);
        return;
      }
    
      const clue = this.getClue(target);
      if (clue) {
        this.handleClue(clue);
        return;
      }
    };
    
    private isActionKey(event: KeyboardEvent): boolean {
      return ((event.key === "Enter") || (event.key === " "))
    }

    private handleAction(event: KeyboardEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const toggle = this.getToggle(target);
      if (toggle) {
        this.handleToggle(toggle);
        return;
      }

      const clue = this.getClue(target);
      if (clue) {
        this.handleClue(clue);
        return;
      }
    }

    private handleToggle(button: HTMLButtonElement): void {
      const sectionId = button.getAttribute(ARIA_CONTROLS);
      if (!sectionId) return;
    
      const section = document.getElementById(sectionId);
      if (!section) return;
    
      const expanded = (button.getAttribute(ARIA_EXPANDED) === "true");
    
      button.setAttribute(ARIA_EXPANDED, String(!expanded));
      section.toggleAttribute(HIDDEN, expanded);

      this.renderClueVisibility();
    }

    private handleClue(clue: HTMLLIElement): void {
      const placementId = clue.dataset.placementId;
      if (!placementId) return;
  
      this.cursorController.moveCursorToPlacement(Number(placementId));
    };

    private handleCopyReveal = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
    
      const clue = this.getClue(target);
      if (!clue) return;
    
      const copyButton = clue.querySelector<HTMLButtonElement>(".clue-copy");
      if (!copyButton) return;
    
      this.revealCurrentCopyButton(copyButton);
    };

    private handleHoverLeave = () => {
      if (this.activeClue) this.revealCurrentCopyButton(this.activeClue.copyButton);
      else if (this.visibleCopyButton) this.hideCurrentCopyButton(this.visibleCopyButton);
    };

    private renderProgressCount(clueCounts: ClueCounts): void {
      this.renderMainProgressCount(clueCounts);
      this.renderSubProgressCount(clueCounts);
    }

    private renderMainProgressCount(clueCounts: ClueCounts): void {
      const todoCount = clueCounts.todoAcrossCount + clueCounts.todoDownCount;
      const solvedCount = clueCounts.solvedAcrossCount + clueCounts.solvedDownCount;

      this.setLabelCount(this.todoCountLabel, todoCount);
      this.setLabelCount(this.solvedCountLabel, solvedCount);
    }

    private renderSubProgressCount(clueCounts: ClueCounts): void {
      this.setLabelCount(this.todoAcrossCountLabel, clueCounts.todoAcrossCount);
      this.setLabelCount(this.todoDownCountLabel, clueCounts.todoDownCount);
      this.setLabelCount(this.solvedAcrossCountLabel, clueCounts.solvedAcrossCount);
      this.setLabelCount(this.solvedDownCountLabel, clueCounts.solvedDownCount);
    }

    private setLabelCount(spanElement: HTMLSpanElement, count: number): void {
      spanElement.textContent = count > 0 ? String(count) : "";
    }

    private revealCurrentCopyButton(button: HTMLButtonElement): void {
      if (this.visibleCopyButton && this.visibleCopyButton !== button) hideCopyButton(this.visibleCopyButton);
    
      revealCopyButton(button);
      this.visibleCopyButton = button;
    }
    
    private hideCurrentCopyButton(button: HTMLButtonElement): void {
      hideCopyButton(button);
    
      if (this.visibleCopyButton === button) this.visibleCopyButton = null;
    }

    /*
      Sets the clue card's empty state based on whether any clues are visible.
      A clue list is visible if its section is expanded, the list is expanded,
      and neither the section nor the list is marked as `.is-empty`.
    */
    private renderClueVisibility(): void {
      const todoSectionVisible =
        !this.todoSection.hidden &&
        !this.todoSection.classList.contains("is-empty");

      const solvedSectionVisible =
        !this.solvedSection.hidden &&
        !this.solvedSection.classList.contains("is-empty");

      const todoAcrossVisible =
        todoSectionVisible &&
        !this.todoAcrossClues.hidden &&
        !this.todoAcrossClues.classList.contains("is-empty");

      const todoDownVisible =
        todoSectionVisible &&
        !this.todoDownClues.hidden &&
        !this.todoDownClues.classList.contains("is-empty");

      const solvedAcrossVisible =
        solvedSectionVisible &&
        !this.solvedAcrossClues.hidden &&
        !this.solvedAcrossClues.classList.contains("is-empty");

      const solvedDownVisible =
        solvedSectionVisible &&
        !this.solvedDownClues.hidden &&
        !this.solvedDownClues.classList.contains("is-empty");

      const anyVisible =
        todoAcrossVisible ||
        todoDownVisible ||
        solvedAcrossVisible ||
        solvedDownVisible;

      this.clueContainer.classList.toggle("show-empty", !anyVisible);
    }

    private renderEmptyState(clueCounts: ClueCounts): void {
      const {todoAcrossCount, todoDownCount, solvedAcrossCount,
        solvedDownCount} = clueCounts;
    
      const todoCount = todoAcrossCount + todoDownCount;
      const solvedCount = solvedAcrossCount + solvedDownCount;
    
      this.setEmptyState(this.solvedDownClues, solvedDownCount);
      this.setEmptyState(this.solvedDownToggle, solvedDownCount);
    
      this.setEmptyState(this.solvedAcrossClues, solvedAcrossCount);
      this.setEmptyState(this.solvedAcrossToggle, solvedAcrossCount);
    
      this.setEmptyState(this.solvedSection, solvedCount);
      this.setEmptyState(this.solvedToggle, solvedCount);
    
      this.setEmptyState(this.todoDownClues, todoDownCount);
      this.setEmptyState(this.todoDownToggle, todoDownCount);
    
      this.setEmptyState(this.todoAcrossClues, todoAcrossCount);
      this.setEmptyState(this.todoAcrossToggle, todoAcrossCount);
        
      this.setEmptyState(this.todoSection, todoCount);
      this.setEmptyState(this.todoToggle, todoCount);
    }

    private setEmptyState(element: HTMLElement, count: number): void {
      const hasItems = (count > 0);
      element.classList.toggle("is-empty", !hasItems);
    } 

    private renderClueList(solvedSet: Set<PlacementId>): ClueCounts {
      const todoAcrossFrag = document.createDocumentFragment();
      const todoDownFrag = document.createDocumentFragment();
      const solvedAcrossFrag = document.createDocumentFragment();
      const solvedDownFrag = document.createDocumentFragment();
      
      // preserves order given that initial clues were ordered correctly.
      for (const [placementId, clueElement] of this.placementClueMap) {
        const clueLiElement = clueElement.liElement;
        const direction = clueLiElement.dataset.placementDirection as Direction | undefined;

        const isSolved = solvedSet.has(placementId);
        const documentFrag: DocumentFragment = (isSolved
                ? (direction === Direction.A ? solvedAcrossFrag : solvedDownFrag)
                : (direction === Direction.A ? todoAcrossFrag : todoDownFrag));
        

        documentFrag.appendChild(clueLiElement);
      }

      const clueCounts = {
        todoAcrossCount: todoAcrossFrag.childElementCount,
        todoDownCount: todoDownFrag.childElementCount,
        solvedAcrossCount: solvedAcrossFrag.childElementCount,
        solvedDownCount: solvedDownFrag.childElementCount
      } as ClueCounts;

      this.todoAcrossClues.replaceChildren(todoAcrossFrag);
      this.todoDownClues.replaceChildren(todoDownFrag);
      this.solvedAcrossClues.replaceChildren(solvedAcrossFrag);
      this.solvedDownClues.replaceChildren(solvedDownFrag);

      return clueCounts;
    }

    private clearActiveClue(): void {
      if (this.activeClue) {
        this.activeClue.liElement.classList.remove(HIGHLIGHT);
        this.hideCurrentCopyButton(this.activeClue.copyButton);
      }

      if (this.visibleCopyButton) {
        this.hideCurrentCopyButton(this.visibleCopyButton);
      }
        
      this.activeClue = null;
    }

    private getToggle(target: HTMLElement): HTMLButtonElement | null {
      const toggle = target.closest(CLUE_TOGGLE) as HTMLButtonElement | null;
      if (!toggle || !this.clueContainer.contains(toggle)) return null;
      return toggle;
    }

    private getClue(target: HTMLElement): HTMLLIElement | null {
      const clue = target.closest(CLUE) as HTMLLIElement | null;
      if (!clue || !this.clueContainer.contains(clue)) return null;
      return clue;
    }

    private createPlacementClueMap(): Map<PlacementId, ClueElement> {
      const placementClueMap = new Map<PlacementId, ClueElement>();

      const clues = this.clueContainer.querySelectorAll<HTMLLIElement>(CLUE);
      for (const clue of clues) {
        const placementId = clue.dataset.placementId;
        if (!placementId) continue;

        const copyButton = clue.querySelector<HTMLButtonElement>(".clue-copy");
        if (!copyButton) continue;

        const clueElement = {
          liElement: clue,
          copyButton: copyButton
        } as ClueElement
    
        placementClueMap.set(Number(placementId), clueElement);
      }

      return placementClueMap;
    }

    // In single column view, clue_card is no longer scrollable.
    // Ensures the page does not scroll when clue is clicked.
    private scrollClue(clue: HTMLLIElement): void {
      const overflowY = getComputedStyle(this.clueContainer).overflowY;
      const canScroll = overflowY === "auto" || overflowY === "scroll";
      
      const isScrollable = canScroll && (this.clueContainer.scrollHeight > this.clueContainer.clientHeight);
      if (!isScrollable) return;
    
      clue.scrollIntoView({block: "nearest"});
    }

    private initClueLists(): void {
      this.todoAcrossClues = this.clueContainer.querySelector(TODO_ACROSS_CLUES)!;
      this.todoDownClues = this.clueContainer.querySelector(TODO_DOWN_CLUES)!;
    
      this.solvedAcrossClues = this.clueContainer.querySelector(SOLVED_ACROSS_CLUES)!;
      this.solvedDownClues = this.clueContainer.querySelector(SOLVED_DOWN_CLUES)!;
    }

    private initToggles(): void {
      this.todoToggle = this.clueContainer.querySelector(TODO_TOGGLE)!;
      this.todoAcrossToggle = this.clueContainer.querySelector(TODO_ACROSS_TOGGLE)!;
      this.todoDownToggle = this.clueContainer.querySelector(TODO_DOWN_TOGGLE)!;
    
      this.solvedToggle = this.clueContainer.querySelector(SOLVED_TOGGLE)!;
      this.solvedAcrossToggle = this.clueContainer.querySelector(SOLVED_ACROSS_TOGGLE)!;
      this.solvedDownToggle = this.clueContainer.querySelector(SOLVED_DOWN_TOGGLE)!;
    }

    private initLabels(): void {
      this.todoCountLabel = this.todoToggle.querySelector(CLUE_COUNT)!;
      this.todoAcrossCountLabel = this.todoAcrossToggle.querySelector(CLUE_COUNT)!;
      this.todoDownCountLabel = this.todoDownToggle.querySelector(CLUE_COUNT)!;
    
      this.solvedCountLabel = this.solvedToggle.querySelector(CLUE_COUNT)!;
      this.solvedAcrossCountLabel = this.solvedAcrossToggle.querySelector(CLUE_COUNT)!;
      this.solvedDownCountLabel = this.solvedDownToggle.querySelector(CLUE_COUNT)!;
    }

    private initSections(): void {
      this.todoSection = this.clueContainer.querySelector(TODO_SECTION)!;
      this.solvedSection = this.clueContainer.querySelector(SOLVED_SECTION)!;
    }

    private initPlacementClues(): void {
      this.placementClueMap = this.createPlacementClueMap();
    }

    private setCursorController(cursorController: CursorController) {
      this.cursorController = cursorController;
    }
}

export { ClueRenderer, ClueView };
