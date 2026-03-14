class ClueRenderer {
    clueContainer: HTMLDivElement;

    constructor(clueContainer: HTMLDivElement) {
        this.clueContainer = clueContainer;

        clueContainer.querySelectorAll(".clue-toggle")
        .forEach(button => {
          button.addEventListener("click", this.handleToggle);
        });
    }
  
    private handleToggle = (event: Event) => {
      const button = event.currentTarget as HTMLButtonElement;

      const sectionId = button.getAttribute("aria-controls");
      if (!sectionId) return;

      const section = document.getElementById(sectionId);
      if (!section) return;
  
      const expanded = button.getAttribute("aria-expanded") === "true";
  
      button.setAttribute("aria-expanded", String(!expanded));
      section.toggleAttribute("hidden", expanded);
    };
}

export {ClueRenderer};
