import { copyClueToClipboard, hideCopyButton, revealCopyButton } from "../app/copyButton.js";
import { isMobileLayout } from "../app/device.js";
import { queryRequired } from "../app/query.js";
import { Direction, PlacementId } from "../models/boardView.js";
import { CursorController } from "../puzzle/puzzleController.js";

const CLASSES = {
  active: "active",
  isEmpty: "is-empty",
  showEmpty: "show-empty",
} as const;

const SELECTORS = {
  clueToggle: ".clue-toggle",
  clue: ".clue",
  clueText: ".clue-text",
  clueCopy: ".clue-copy",
  clueCount: ".clue-count",

  todoAcrossClues: "#todo-across-clues",
  todoDownClues: "#todo-down-clues",
  solvedAcrossClues: "#solved-across-clues",
  solvedDownClues: "#solved-down-clues",

  todoToggle: "#todo-toggle",
  todoAcrossToggle: "#todo-across-toggle",
  todoDownToggle: "#todo-down-toggle",
  solvedToggle: "#solved-toggle",
  solvedAcrossToggle: "#solved-across-toggle",
  solvedDownToggle: "#solved-down-toggle",

  todoSection: "#todo-section",
  solvedSection: "#solved-section",
} as const;

const ATTRIBUTES = {
  ariaControls: "aria-controls",
  ariaExpanded: "aria-expanded",
  hidden: "hidden",
} as const;

const EVENTS = {
  clueCopyReveal: "cluecopyreveal",
  clueShowAnswer: "clueshowanswer",
} as const;

type ClueCounts = {
  todoAcrossCount: number;
  todoDownCount: number;
  solvedAcrossCount: number;
  solvedDownCount: number;
};

interface ClueView {
  focusToggle(): void;
  renderClues(solved: PlacementId[]): void;
  clearClues(): void;
  renderClue(placementId: PlacementId): void;
  scrollActiveClue(): void;
  copyClueText(placementId: PlacementId): void;
}

type ClueElement = {
  liElement: HTMLLIElement;
  copyButton: HTMLButtonElement;
};

const NullCursorController: CursorController = {
  handleClueClick(_placementId: PlacementId): void {},
  handleShowAnswerClick(_placementId: PlacementId): void {}
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
      this.clueContainer.addEventListener(EVENTS.clueCopyReveal, this.handleCopyReveal as EventListener);
      this.clueContainer.addEventListener(EVENTS.clueShowAnswer, this.handleShowClueAnswer as EventListener);
    }

    focusToggle(): void {
      if (document.activeElement !== this.todoToggle) this.todoToggle.focus();  
    }

    renderClues(solved: PlacementId[]): void {
      const solvedSet = new Set(solved);
      const clueCounts: ClueCounts = this.renderClueList(solvedSet);
      
      this.renderProgressCount(clueCounts);
      this.renderEmptyState(clueCounts);
      this.renderClueVisibility();
    }

    copyClueText(placementId: PlacementId): void {
      const TIMEOUT_MS = 800;

      const clueElement = this.placementClueMap.get(placementId);
      if (!clueElement?.copyButton) return;

      const clueTextNode = queryRequired(clueElement.liElement, SELECTORS.clueText, HTMLSpanElement);

      const clueText = clueTextNode.firstChild?.textContent?.trim() ?? "";
      if (!clueText) return;

      void copyClueToClipboard(clueElement.copyButton, clueText, TIMEOUT_MS);
    }

    clearClues(): void {
      const clueCounts: ClueCounts = this.renderClueList(new Set<PlacementId>());      
      this.renderProgressCount(clueCounts);
      this.renderEmptyState(clueCounts);

      this.renderClueVisibility();
      this.clearActiveClue();
    }

    renderClue(placementId: PlacementId): void {
      const clueElement = this.placementClueMap.get(placementId);
      if (!clueElement) return;
  
      this.clearActiveClue();
      this.activeClue = clueElement;
      clueElement.liElement.classList.add(CLASSES.active);
      this.revealCurrentCopyButton(clueElement.copyButton);
    }

    scrollActiveClue(): void {
      if (!this.activeClue) return;
  
      if (isMobileLayout()) {
          this.scrollClueMobile(this.activeClue.liElement);
      } else {
          this.scrollClue(this.activeClue.liElement);
      }
    }

    private handleContainerKeydown = (event: KeyboardEvent) => {
      if (this.isActionKey(event)) {
        event.preventDefault();
        this.handleAction(event);
        return;
      }
    }

    /*
      Preserves board input focus when pressing a clue.
      Without this, focus falls to <body>, interrupting input focus.
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
      return ((event.key === "Enter") || (event.key === " "));
    }

    private handleAction(event: KeyboardEvent): void {
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
      const sectionId = button.getAttribute(ATTRIBUTES.ariaControls);
      if (!sectionId) return;
    
      const section = document.getElementById(sectionId);
      if (!section) return;
    
      const expanded = (button.getAttribute(ATTRIBUTES.ariaExpanded) === "true");
    
      button.setAttribute(ATTRIBUTES.ariaExpanded, String(!expanded));
      section.toggleAttribute(ATTRIBUTES.hidden, expanded);

      this.renderClueVisibility();
    }

    private handleClue(clue: HTMLLIElement): void {
      const placementId = this.getPlacementId(clue);
      if (placementId === null) return;
  
      this.cursorController.handleClueClick(placementId);
    };

    private handleCopyReveal = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
    
      const clue = this.getClue(target);
      if (!clue) return;
    
      const copyButton = queryRequired(clue, SELECTORS.clueCopy, HTMLButtonElement);
    
      this.revealCurrentCopyButton(copyButton);
    };

    private handleShowClueAnswer = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
    
      const clue = this.getClue(target);
      if (!clue) return;
      
      const placementId = this.getPlacementId(clue);
      if (placementId === null) return;

      this.cursorController.handleShowAnswerClick(placementId);
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
      const todoSectionVisible = this.isVisible(this.todoSection);

      const solvedSectionVisible = this.isVisible(this.solvedSection);

      const todoAcrossVisible = todoSectionVisible && this.isVisible(this.todoAcrossClues);

      const todoDownVisible = todoSectionVisible && this.isVisible(this.todoDownClues);

      const solvedAcrossVisible = solvedSectionVisible && this.isVisible(this.solvedAcrossClues);

      const solvedDownVisible = solvedSectionVisible && this.isVisible(this.solvedDownClues);

      const anyVisible =
        todoAcrossVisible ||
        todoDownVisible ||
        solvedAcrossVisible ||
        solvedDownVisible;

      this.clueContainer.classList.toggle(CLASSES.showEmpty, !anyVisible);
    }

    private isVisible(element: HTMLElement): boolean {
      return !element.hidden && !element.classList.contains(CLASSES.isEmpty);
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
      element.classList.toggle(CLASSES.isEmpty, !hasItems);
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

      const clueCounts: ClueCounts = {
        todoAcrossCount: todoAcrossFrag.childElementCount,
        todoDownCount: todoDownFrag.childElementCount,
        solvedAcrossCount: solvedAcrossFrag.childElementCount,
        solvedDownCount: solvedDownFrag.childElementCount,
      };

      this.todoAcrossClues.replaceChildren(todoAcrossFrag);
      this.todoDownClues.replaceChildren(todoDownFrag);
      this.solvedAcrossClues.replaceChildren(solvedAcrossFrag);
      this.solvedDownClues.replaceChildren(solvedDownFrag);

      return clueCounts;
    }

    private clearActiveClue(): void {
      if (this.activeClue) {
        this.activeClue.liElement.classList.remove(CLASSES.active);
        this.hideCurrentCopyButton(this.activeClue.copyButton);
      }

      if (this.visibleCopyButton) {
        this.hideCurrentCopyButton(this.visibleCopyButton);
      }
        
      this.activeClue = null;
    }

    private getPlacementId(clue: HTMLElement): number | null {
      const id = clue.dataset.placementId;
      if (!id) return null;
    
      const parsed = Number(id);
      return Number.isNaN(parsed) ? null : parsed;
    }

    private getToggle(target: HTMLElement): HTMLButtonElement | null {
      const toggle = target.closest(SELECTORS.clueToggle) as HTMLButtonElement | null;
      if (!toggle || !this.clueContainer.contains(toggle)) return null;
      return toggle;
    }

    private getClue(target: HTMLElement): HTMLLIElement | null {
      const clue = target.closest(SELECTORS.clue) as HTMLLIElement | null;
      if (!clue || !this.clueContainer.contains(clue)) return null;
      return clue;
    }

    private createPlacementClueMap(): Map<PlacementId, ClueElement> {
      const placementClueMap = new Map<PlacementId, ClueElement>();

      const clues = this.clueContainer.querySelectorAll<HTMLLIElement>(SELECTORS.clue);
      for (const clue of clues) {
        const placementId = this.getPlacementId(clue);
        if (placementId === null) continue;

        const copyButton = queryRequired(clue, SELECTORS.clueCopy, HTMLButtonElement);

        const clueElement: ClueElement = {
          liElement: clue,
          copyButton,
        };
    
        placementClueMap.set(placementId, clueElement);
      }

      return placementClueMap;
    }

    private scrollClue(clue: HTMLLIElement): void {
      const PADDING = 8;
      const container = this.clueContainer;

      const clueRect = clue.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
  
      const isAbove = clueRect.top < (containerRect.top + PADDING);
      const isBelow = clueRect.bottom > (containerRect.bottom - PADDING);
  
      if (isAbove) {
          container.scrollTop += clueRect.top - (containerRect.top + PADDING);
          return;
      }
  
      if (isBelow) {
          container.scrollTop += clueRect.bottom - (containerRect.bottom - PADDING);
          return;
      }
    }

    private scrollClueMobile(clue: HTMLLIElement): void {
      const PADDING = 8;
      const container = this.clueContainer;
  
      const clueRect = clue.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
  
      const delta = clueRect.bottom - (containerRect.bottom - PADDING);
  
      container.scrollTop += delta;
    }
  
    private initClueLists(): void {
      this.todoAcrossClues = queryRequired(this.clueContainer, SELECTORS.todoAcrossClues, HTMLOListElement);
      this.todoDownClues = queryRequired(this.clueContainer, SELECTORS.todoDownClues, HTMLOListElement);
    
      this.solvedAcrossClues = queryRequired(this.clueContainer, SELECTORS.solvedAcrossClues, HTMLOListElement);
      this.solvedDownClues = queryRequired(this.clueContainer, SELECTORS.solvedDownClues, HTMLOListElement);
    }
    
    private initToggles(): void {
      this.todoToggle = queryRequired(this.clueContainer, SELECTORS.todoToggle, HTMLButtonElement);
      this.todoAcrossToggle = queryRequired(this.clueContainer, SELECTORS.todoAcrossToggle, HTMLButtonElement);
      this.todoDownToggle = queryRequired(this.clueContainer, SELECTORS.todoDownToggle, HTMLButtonElement);
    
      this.solvedToggle = queryRequired(this.clueContainer, SELECTORS.solvedToggle, HTMLButtonElement);
      this.solvedAcrossToggle = queryRequired(this.clueContainer, SELECTORS.solvedAcrossToggle, HTMLButtonElement);
      this.solvedDownToggle = queryRequired(this.clueContainer, SELECTORS.solvedDownToggle, HTMLButtonElement);
    }
    
    private initLabels(): void {
      this.todoCountLabel = queryRequired(this.todoToggle, SELECTORS.clueCount, HTMLSpanElement);
      this.todoAcrossCountLabel = queryRequired(this.todoAcrossToggle, SELECTORS.clueCount, HTMLSpanElement);
      this.todoDownCountLabel = queryRequired(this.todoDownToggle, SELECTORS.clueCount, HTMLSpanElement);
    
      this.solvedCountLabel = queryRequired(this.solvedToggle, SELECTORS.clueCount, HTMLSpanElement);
      this.solvedAcrossCountLabel = queryRequired(this.solvedAcrossToggle, SELECTORS.clueCount, HTMLSpanElement);
      this.solvedDownCountLabel = queryRequired(this.solvedDownToggle, SELECTORS.clueCount, HTMLSpanElement);
    }
    
    private initSections(): void {
      this.todoSection = queryRequired(this.clueContainer, SELECTORS.todoSection, HTMLDivElement);
      this.solvedSection = queryRequired(this.clueContainer, SELECTORS.solvedSection, HTMLDivElement);
    }

    private initPlacementClues(): void {
      this.placementClueMap = this.createPlacementClueMap();
    }

    private setCursorController(cursorController: CursorController): void {
      this.cursorController = cursorController;
    }
}

export { ClueRenderer, ClueView };
