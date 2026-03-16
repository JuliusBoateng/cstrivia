import {CursorController} from "./puzzleController.js"
import {PlacementId, Direction} from "../models/boardView.js";

const CLUE_TOGGLE = ".clue-toggle";
const CLUE = ".clue";
const ARIA_CONTROLS = "aria-controls";
const ARIA_EXPANDED = "aria-expanded";
const HIDDEN = "hidden";
const NAV_SELECTOR = ".clue-toggle, .clue";
const HIGHLIGHT = "highlight";
const CLUE_CARD = ".clue-card";
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

type ClueCounts = {todo_access_count: number,
          todo_down_count: number,
          solved_across_count: number,
          solved_down_count: number}

interface ClueView {
  highlightClue(placementId: PlacementId): void;
  renderClues(solved: PlacementId[]): void;
}

const NullCursorController: CursorController = {
  setCursorByPlacement(_placementId: PlacementId): void {}
};

class ClueRenderer {
    private clueContainer: HTMLDivElement;
    private cursorController: CursorController;
    private navItems: HTMLElement[];
    private navIndexMap: Map<HTMLElement, number>;
    private placementClueMap: Map<PlacementId, HTMLLIElement>;
    private activeClue: HTMLElement | null; 

    private todoAcross: HTMLOListElement;
    private todoDown: HTMLOListElement;
    private solvedAcross: HTMLOListElement;
    private solvedDown: HTMLOListElement;

    constructor(clueContainer: HTMLDivElement) {
        this.clueContainer = clueContainer;
        this.cursorController = NullCursorController;
        this.activeClue = null;

        this.navItems = [];
        this.navIndexMap = new Map<HTMLElement, number>()
        this.placementClueMap = new Map<PlacementId, HTMLLIElement>();

        // initialize clue_list
        this.todoAcross = document.querySelector(TODO_ACROSS_CLUES)!;
        this.todoDown = document.querySelector(TODO_DOWN_CLUES)!;
        this.solvedAcross = document.querySelector(SOLVED_ACROSS_CLUES)!;
        this.solvedDown = document.querySelector(SOLVED_DOWN_CLUES)!;
        
        this.navItems = this.createNavItems();
        this.navIndexMap = this.createNavIndexMap(this.navItems);
        this.placementClueMap = this.createPlacementClueMap(this.navItems);

        clueContainer.addEventListener("click", this.handleContainerClick);
        clueContainer.addEventListener("keydown", this.handleContainerKeydown);
    }

    renderClues(solved: PlacementId[]): void {
      const solvedSet = new Set(solved);
      const clueCounts: ClueCounts = this.renderClueList(solvedSet);
      
      console.log(clueCounts);
      this.renderProgressCount(clueCounts);
    }

    private renderProgressCount(clueCounts: ClueCounts) {
      this.renderMainProgressCount(clueCounts);
      this.renderSubProgressCount(clueCounts);
    }

    private renderMainProgressCount(clueCounts: ClueCounts) {
      const todoCount = clueCounts.todo_access_count + clueCounts.todo_down_count;
      const solvedCount = clueCounts.solved_across_count + clueCounts.solved_down_count;

      const todoClueLabel = this.clueContainer.querySelector(TODO_TOGGLE)!.querySelector(CLUE_COUNT) as HTMLSpanElement;
      todoClueLabel.textContent = String(todoCount);

      const solvedClueLabel = this.clueContainer.querySelector(SOLVED_TOGGLE)!.querySelector(CLUE_COUNT) as HTMLSpanElement;
      solvedClueLabel.textContent = String(solvedCount);
    }

    private renderSubProgressCount(clueCounts: ClueCounts) {
      const todoAcrossLabel = this.clueContainer.querySelector(TODO_ACROSS_TOGGLE)!.querySelector(CLUE_COUNT) as HTMLSpanElement;
      todoAcrossLabel.textContent = String(clueCounts.todo_access_count);

      const todoDownLabel = this.clueContainer.querySelector(TODO_DOWN_TOGGLE)!.querySelector(CLUE_COUNT) as HTMLSpanElement;
      todoDownLabel.textContent = String(clueCounts.todo_down_count);

      const solvedAcrossLabel = this.clueContainer.querySelector(SOLVED_ACROSS_TOGGLE)!.querySelector(CLUE_COUNT) as HTMLSpanElement;
      solvedAcrossLabel.textContent = String(clueCounts.solved_across_count);

      const solvedDownLabel = this.clueContainer.querySelector(SOLVED_DOWN_TOGGLE)!.querySelector(CLUE_COUNT) as HTMLSpanElement;
      solvedDownLabel.textContent = String(clueCounts.solved_down_count);
    }

    private renderClueList(solvedSet: Set<PlacementId>): ClueCounts {
      const todoAcrossFrag = document.createDocumentFragment();
      const todoDownFrag = document.createDocumentFragment();
      const solvedAcrossFrag = document.createDocumentFragment();
      const solvedDownFrag = document.createDocumentFragment();
      
      // preserves order given that initial clues were ordered correctly.
      for (const [placementId, clueLiElement] of this.placementClueMap) {
        const direction = clueLiElement.dataset.placementDirection as Direction | undefined;
        if (!direction) continue;

        const isSolved = solvedSet.has(placementId);
    
        const documentFrag: DocumentFragment = (isSolved
                ? (direction === Direction.A ? solvedAcrossFrag : solvedDownFrag)
                : (direction === Direction.A ? todoAcrossFrag : todoDownFrag));
        

        documentFrag.appendChild(clueLiElement);
      }

      const clueCounts = {
        todo_access_count: todoAcrossFrag.childElementCount,
        todo_down_count: todoDownFrag.childElementCount,
        solved_across_count: solvedAcrossFrag.childElementCount,
        solved_down_count: solvedDownFrag.childElementCount
      } as ClueCounts;

      this.todoAcross.replaceChildren(todoAcrossFrag);
      this.todoDown.replaceChildren(todoDownFrag);
      this.solvedAcross.replaceChildren(solvedAcrossFrag);
      this.solvedDown.replaceChildren(solvedDownFrag);

      return clueCounts;
    }

    setCursorController(cursorController: CursorController) {
      this.cursorController = cursorController;
    }

    highlightClue(placementId: PlacementId): void {
      const clue = this.placementClueMap.get(placementId);
      if (!clue) return;

      if (this.activeClue) this.activeClue.classList.remove(HIGHLIGHT)

      this.activeClue = clue;
      clue.classList.add(HIGHLIGHT);
      this.scrollClue(clue);
    }

    private handleContainerKeydown = (event: KeyboardEvent) => {
      if (this.isActionKey(event)) {
        this.handleAction(event);
      }
      
      else if (this.isVerticalArrowPress(event)) {
        this.handleVerticalArrowPress(event);
      }
    }

    private handleContainerClick = (event: Event) => {
      const target = event.target as HTMLElement;
    
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

    private isActionKey(event: KeyboardEvent) {
      return ((event.key === "Enter") || (event.key === " "))
    }

    private isVerticalArrowPress(event: KeyboardEvent) {
      return ((event.key === "ArrowDown") || (event.key === "ArrowUp"))
    }

    private handleVerticalArrowPress(event: KeyboardEvent) {
      event.preventDefault();
      const target = event.target as HTMLElement;
      const start = target.closest(".clue, .clue-toggle") as HTMLElement | null;
      if (!start) return;
    
      const index = this.navIndexMap.get(start);
      if (index === undefined) return;
    
      const nextIndex = ((event.key === "ArrowDown") ? index + 1 : index - 1);
    
      const next = this.navItems[nextIndex];
      if (next) next.focus();
    }

    private handleAction(event: KeyboardEvent) {
      event.preventDefault();
      const target = event.target as HTMLElement;
      const clue = this.getClue(target);
      if (!clue) return;

      this.handleClue(clue);
    }

    private handleToggle(button: HTMLButtonElement) {
      const sectionId = button.getAttribute(ARIA_CONTROLS);
      if (!sectionId) return;
    
      const section = document.getElementById(sectionId);
      if (!section) return;
    
      const expanded = (button.getAttribute(ARIA_EXPANDED) === "true");
    
      button.setAttribute(ARIA_EXPANDED, String(!expanded));
      section.toggleAttribute(HIDDEN, expanded);
    }

    private handleClue(li: HTMLLIElement) {
      const placementId = li.dataset.placementId;
      if (!placementId) return;
  
      this.cursorController.setCursorByPlacement(Number(placementId));
    };

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

    private createNavItems() {
      return Array.from(this.clueContainer.querySelectorAll<HTMLElement>(NAV_SELECTOR));
    }

    private createNavIndexMap(navItems: HTMLElement[]) {
      const navIndexMap = new Map<HTMLElement, number>();
      navItems.forEach((element, index) => {navIndexMap.set(element, index)});
      return navIndexMap;
    }

    private createPlacementClueMap(navItems: HTMLElement[]): Map<PlacementId, HTMLLIElement> {
      const placementClueMap = new Map<PlacementId, HTMLLIElement>();
      for (const element of navItems) {
        if (!(element.tagName === "LI" && element.classList.contains("clue"))) continue;

        const placementId = element.dataset.placementId;
        if (!placementId) continue;
    
        placementClueMap.set(Number(placementId), element as HTMLLIElement);
      }

      return placementClueMap;
    }

    // In single column view, clue_card is no longer scrollable.
    // Ensures the page does not scroll when clue is clicked.
    private scrollClue(clue: HTMLLIElement) {
      const clue_card = document.querySelector(CLUE_CARD) as HTMLDivElement | null;
      if (!clue_card) return;
    
      // Check if clue_card is scrollable
      const isScrollable = (clue_card.scrollHeight > clue_card.clientHeight) &&
                            (getComputedStyle(clue_card).overflowY !== "visible");
    
      if (!isScrollable) {
        // Mobile / page-scroll mode → do nothing
        return;
      }
    
      // Desktop / internal-scroll mode
      clue.scrollIntoView({block: "nearest"});
    }
}

export {ClueRenderer, ClueView};
