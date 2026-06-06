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

type ClueListElements = {
  list: HTMLOListElement;
  toggle: HTMLButtonElement;
  countLabel: HTMLSpanElement;
};

type ClueGroupElements = {
  section: HTMLDivElement;
  toggle: HTMLButtonElement;
  countLabel: HTMLSpanElement;
  across: ClueListElements;
  down: ClueListElements;
};

type ClueRendererElements = {
  todo: ClueGroupElements;
  solved: ClueGroupElements;
};

const NullCursorController: CursorController = {
  handleClueClick(_placementId: PlacementId): void {},
  handleShowAnswerClick(_placementId: PlacementId): void {},
};

/*
  Manages clue panel rendering, state updates, focus behavior,
  scrolling, and clue-related interactions.
*/
class ClueRenderer implements ClueView {
  private clueContainer: HTMLDivElement;
  private cursorController: CursorController;
  private placementClueMap: Map<PlacementId, ClueElement>;
  private activeClue: ClueElement | null;
  private elements: ClueRendererElements;
  private visibleCopyButton: HTMLButtonElement | null = null;

  constructor(clueContainer: HTMLDivElement) {
    this.clueContainer = clueContainer;
    this.cursorController = NullCursorController;
    this.activeClue = null;
    this.placementClueMap = new Map<PlacementId, ClueElement>();

    this.elements = queryClueRendererElements(this.clueContainer);
  }

  init(cursorController: CursorController): void {
    this.cursorController = cursorController;
    this.placementClueMap = this.createPlacementClueMap();

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
    if (document.activeElement !== this.elements.todo.toggle) this.elements.todo.toggle.focus();
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
    if (!clueElement) return;

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
    if (!this.isActionKey(event)) return;

    event.preventDefault();
    this.handleAction(event);
  };

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
    return event.key === "Enter" || event.key === " ";
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

    const expanded = button.getAttribute(ATTRIBUTES.ariaExpanded) === "true";

    button.setAttribute(ATTRIBUTES.ariaExpanded, String(!expanded));
    section.toggleAttribute(ATTRIBUTES.hidden, expanded);

    this.renderClueVisibility();
  }

  private handleClue(clue: HTMLLIElement): void {
    const placementId = this.getPlacementId(clue);
    if (placementId === null) return;

    this.cursorController.handleClueClick(placementId);
  }

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

    this.setLabelCount(this.elements.todo.countLabel, todoCount);
    this.setLabelCount(this.elements.solved.countLabel, solvedCount);
  }

  private renderSubProgressCount(clueCounts: ClueCounts): void {
    this.setLabelCount(this.elements.todo.across.countLabel, clueCounts.todoAcrossCount);
    this.setLabelCount(this.elements.todo.down.countLabel, clueCounts.todoDownCount);
    this.setLabelCount(this.elements.solved.across.countLabel, clueCounts.solvedAcrossCount);
    this.setLabelCount(this.elements.solved.down.countLabel, clueCounts.solvedDownCount);
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
    const todoSectionVisible = this.isVisible(this.elements.todo.section);
    const todoAcrossVisible = todoSectionVisible && this.isVisible(this.elements.todo.across.list);
    const todoDownVisible = todoSectionVisible && this.isVisible(this.elements.todo.down.list);

    const solvedSectionVisible = this.isVisible(this.elements.solved.section);
    const solvedAcrossVisible = solvedSectionVisible && this.isVisible(this.elements.solved.across.list);
    const solvedDownVisible = solvedSectionVisible && this.isVisible(this.elements.solved.down.list);

    const anyVisible = todoAcrossVisible || todoDownVisible || solvedAcrossVisible || solvedDownVisible;

    this.clueContainer.classList.toggle(CLASSES.showEmpty, !anyVisible);
  }

  private isVisible(element: HTMLElement): boolean {
    return !element.hidden && !element.classList.contains(CLASSES.isEmpty);
  }

  private renderEmptyState(clueCounts: ClueCounts): void {
    const { todoAcrossCount, todoDownCount, solvedAcrossCount, solvedDownCount } = clueCounts;

    const todoCount = todoAcrossCount + todoDownCount;
    const solvedCount = solvedAcrossCount + solvedDownCount;

    this.setClueSectionEmptyState(this.elements.todo, todoCount);
    this.setClueSectionEmptyState(this.elements.solved, solvedCount);

    this.setClueListEmptyState(this.elements.solved.down, solvedDownCount);
    this.setClueListEmptyState(this.elements.solved.across, solvedAcrossCount);
    this.setClueListEmptyState(this.elements.todo.down, todoDownCount);
    this.setClueListEmptyState(this.elements.todo.across, todoAcrossCount);
  }

  private setClueSectionEmptyState(clueGroup: ClueGroupElements, count: number): void {
    this.setEmptyState(clueGroup.section, count);
    this.setEmptyState(clueGroup.toggle, count);
  }

  private setClueListEmptyState(clueElements: ClueListElements, count: number): void {
    this.setEmptyState(clueElements.list, count);
    this.setEmptyState(clueElements.toggle, count);
  }

  private setEmptyState(element: HTMLElement, count: number): void {
    const hasItems = count > 0;
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
      const documentFrag: DocumentFragment = isSolved
        ? direction === Direction.A
          ? solvedAcrossFrag
          : solvedDownFrag
        : direction === Direction.A
          ? todoAcrossFrag
          : todoDownFrag;

      documentFrag.appendChild(clueLiElement);
    }

    const clueCounts: ClueCounts = {
      todoAcrossCount: todoAcrossFrag.childElementCount,
      todoDownCount: todoDownFrag.childElementCount,
      solvedAcrossCount: solvedAcrossFrag.childElementCount,
      solvedDownCount: solvedDownFrag.childElementCount,
    };

    this.elements.todo.across.list.replaceChildren(todoAcrossFrag);
    this.elements.todo.down.list.replaceChildren(todoDownFrag);
    this.elements.solved.across.list.replaceChildren(solvedAcrossFrag);
    this.elements.solved.down.list.replaceChildren(solvedDownFrag);

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

    const isAbove = clueRect.top < containerRect.top + PADDING;
    const isBelow = clueRect.bottom > containerRect.bottom - PADDING;

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
}

/*
  Queries and groups all DOM elements required by ClueRenderer.

  The returned structure mirrors the clue panel hierarchy so renderer code can work with
  logical groups instead of individual DOM references.
*/
function queryClueRendererElements(container: HTMLDivElement): ClueRendererElements {
  const todoToggle = queryRequired(container, SELECTORS.todoToggle, HTMLButtonElement);
  const solvedToggle = queryRequired(container, SELECTORS.solvedToggle, HTMLButtonElement);

  const todoAcrossToggle = queryRequired(container, SELECTORS.todoAcrossToggle, HTMLButtonElement);
  const todoDownToggle = queryRequired(container, SELECTORS.todoDownToggle, HTMLButtonElement);

  const solvedAcrossToggle = queryRequired(container, SELECTORS.solvedAcrossToggle, HTMLButtonElement);
  const solvedDownToggle = queryRequired(container, SELECTORS.solvedDownToggle, HTMLButtonElement);

  return {
    todo: {
      section: queryRequired(container, SELECTORS.todoSection, HTMLDivElement),
      toggle: todoToggle,
      countLabel: queryRequired(todoToggle, SELECTORS.clueCount, HTMLSpanElement),
      across: {
        list: queryRequired(container, SELECTORS.todoAcrossClues, HTMLOListElement),
        toggle: todoAcrossToggle,
        countLabel: queryRequired(todoAcrossToggle, SELECTORS.clueCount, HTMLSpanElement),
      },
      down: {
        list: queryRequired(container, SELECTORS.todoDownClues, HTMLOListElement),
        toggle: todoDownToggle,
        countLabel: queryRequired(todoDownToggle, SELECTORS.clueCount, HTMLSpanElement),
      },
    },
    solved: {
      section: queryRequired(container, SELECTORS.solvedSection, HTMLDivElement),
      toggle: solvedToggle,
      countLabel: queryRequired(solvedToggle, SELECTORS.clueCount, HTMLSpanElement),
      across: {
        list: queryRequired(container, SELECTORS.solvedAcrossClues, HTMLOListElement),
        toggle: solvedAcrossToggle,
        countLabel: queryRequired(solvedAcrossToggle, SELECTORS.clueCount, HTMLSpanElement),
      },
      down: {
        list: queryRequired(container, SELECTORS.solvedDownClues, HTMLOListElement),
        toggle: solvedDownToggle,
        countLabel: queryRequired(solvedDownToggle, SELECTORS.clueCount, HTMLSpanElement),
      },
    },
  };
}

export { ClueRenderer, ClueView };
