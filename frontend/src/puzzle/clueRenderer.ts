import {BoardView, Placement, PlacementId} from "../models/boardView.js";
import {CursorController} from "./puzzleController.js"

class ClueRenderer {
    private clueContainer: HTMLDivElement;
    private cursorController: CursorController;

    constructor(clueContainer: HTMLDivElement, cursorController: CursorController) {
        this.clueContainer = clueContainer;
        this.cursorController = cursorController;
        clueContainer.addEventListener("pointerdown", this.handlePointerInput.bind(this))
    }

    private handlePointerInput = (event: PointerEvent) => {
      if (!event.isPrimary) return; // ignore multi-touch / secondary stylus
      if (event.button !== 0) return; // ignore right/middle clicks

      const target = event.target as HTMLElement;
      if (!target) return;
    
      const toggle = this.getButtonToggleClick(target);
      if (toggle) {
        this.handleToggle(toggle);
        return;
      }
    
      const clue = this.getClueClick(target);
      if (clue) {
        this.handleClueClick(clue);
        return;
      }
    };

    private getButtonToggleClick(target: HTMLElement): HTMLButtonElement | null {
      const toggle = target.closest(".clue-toggle") as HTMLButtonElement | null;
      if (!this.clueContainer.contains(toggle)) return null;
      return toggle;
    }

    private getClueClick(target: HTMLElement): HTMLLIElement | null {
      const clue = target.closest(".clue") as HTMLLIElement | null;
      if (!this.clueContainer.contains(clue)) return null;
      return clue;
    }

    private handleToggle(button: HTMLButtonElement) {
      const sectionId = button.getAttribute("aria-controls");
      if (!sectionId) return;
    
      const section = document.getElementById(sectionId);
      if (!section) return;
    
      const expanded = (button.getAttribute("aria-expanded") === "true");
    
      button.setAttribute("aria-expanded", String(!expanded));
      section.toggleAttribute("hidden", expanded);
    }

    private handleClueClick(li: HTMLLIElement) {
      const placementId = li.dataset.placementId;
      if (!placementId) return;
  
      this.cursorController.setCursorByPlacement(Number(placementId));
  };
}

export {ClueRenderer};
