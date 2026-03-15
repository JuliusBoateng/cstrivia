import {CursorController} from "./puzzleController.js"

const CLUE_TOGGLE = ".clue-toggle";
const CLUE = ".clue";
const ARIA_CONTROLS = "aria-controls";
const ARIA_EXPANDED = "aria-expanded";
const HIDDEN = "hidden";
const NAV_SELECTOR = ".clue-toggle, .clue";

class ClueRenderer {
    private clueContainer: HTMLDivElement;
    private cursorController: CursorController;
    private navItems: HTMLElement[] = [];
    private navIndexMap = new Map<HTMLElement, number>();

    constructor(clueContainer: HTMLDivElement, cursorController: CursorController) {
        this.clueContainer = clueContainer;
        this.cursorController = cursorController;
        
        this.navItems = Array.from(this.clueContainer.querySelectorAll<HTMLElement>(NAV_SELECTOR));
        this.navItems.forEach(
          (element, index) => {this.navIndexMap.set(element, index)}
        );

        clueContainer.addEventListener("click", this.handleContainerClick);
        clueContainer.addEventListener("keydown", this.handleContainerKeydown);
    }

    private handleContainerKeydown = (event: KeyboardEvent) => {
      if (this.isActionKey(event)) {
        this.handleAction(event);
      }
      
      else if (this.isVerticalArrow(event)) {
        this.handleVerticalArrow(event);
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

    private isVerticalArrow(event: KeyboardEvent) {
      return ((event.key === "ArrowDown") || (event.key === "ArrowUp"))
    }

    private handleVerticalArrow(event: KeyboardEvent) {
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
}

export {ClueRenderer};
