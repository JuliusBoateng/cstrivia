import {CursorController} from "./puzzleController.js"
import {Placement, PlacementId} from "../models/boardView.js";

const CLUE_TOGGLE = ".clue-toggle";
const CLUE = ".clue";
const ARIA_CONTROLS = "aria-controls";
const ARIA_EXPANDED = "aria-expanded";
const HIDDEN = "hidden";
const NAV_SELECTOR = ".clue-toggle, .clue";
const HIGHLIGHT = "highlight";

interface ClueView {
  highlightClue(placementId: PlacementId): void;
}

const NullCursorController: CursorController = {
  setCursorByPlacement(_placementId: PlacementId): void {}
};

class ClueRenderer {
    private clueContainer: HTMLDivElement;
    private cursorController: CursorController;
    private navItems: HTMLElement[] = [];
    private navIndexMap = new Map<HTMLElement, number>();
    private placementClueMap = new Map<PlacementId, HTMLLIElement>();
    private activeClue: HTMLElement | null = null; 

    constructor(clueContainer: HTMLDivElement) {
        this.clueContainer = clueContainer;
        this.cursorController = NullCursorController;
        
        this.navItems = this.createNavItems();
        this.navIndexMap = this.createNavIndexMap(this.navItems);
        this.placementClueMap = this.createPlacementClueMap(this.navItems);

        clueContainer.addEventListener("click", this.handleContainerClick);
        clueContainer.addEventListener("keydown", this.handleContainerKeydown);
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
      // clue.scrollIntoView({ block: "nearest" }); Evaluate this along with overflow-y:
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
}

export {ClueRenderer, ClueView};
