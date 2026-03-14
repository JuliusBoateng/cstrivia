import { BoardView, Clue, Direction, Placement, PlacementId} from "../models/boardView.js";

function createClue(boardView: BoardView, clueContainer: HTMLDivElement) {
    const clueMap: Map<PlacementId, Clue> = boardView.getClueMap();
    const placements = boardView.getPlacements();

    const {acrossNodes, downNodes} = createDirectionElements();

    const acrossToggle = clueContainer.querySelector("#todo-across-toggle") as HTMLButtonElement;
    const downToggle = clueContainer.querySelector("#todo-down-toggle") as HTMLButtonElement;

    setToggleCount(acrossToggle, acrossNodes.length);
    setToggleCount(downToggle, downNodes.length);

    renderClues(acrossNodes, downNodes);

    // TODO Add counts to each section so that users can know how many items are in each section.
    function createDirectionElements(): {acrossNodes: HTMLLIElement[], downNodes: HTMLLIElement[]} {
        const acrossNodes: HTMLLIElement[] = [];
        const downNodes: HTMLLIElement[] = [];

        for (const placement of placements) {
            const clue = clueMap.get(placement.id);
            if (!clue) continue;
    
            const liElement = createLiElement(placement, clue);
        
            if (placement.direction === Direction.A) {
                acrossNodes.push(liElement);
            } else {
                downNodes.push(liElement);
            }
        }

        return {acrossNodes, downNodes};
    }

    function createLiElement(placement: Placement, clue: Clue): HTMLLIElement {
        const liElement = document.createElement("li");
        liElement.classList.add("clue");

        liElement.dataset.placementId = placement.id.toString();
        liElement.dataset.direction = placement.direction;

        const textSpan = createLiText(clue);
        const labelSpan = createLabel(placement)
        liElement.append(labelSpan, textSpan);

        return liElement;
    }

    function createLiText(clue: Clue): HTMLSpanElement {
        const textSpan = document.createElement("span");
        textSpan.classList.add("clue-text");

        textSpan.textContent = clue.question;

        return textSpan;
    }

    function createLabel(placement: Placement): HTMLSpanElement {
        const labelSpan = document.createElement("span");
        labelSpan.classList.add("clue-label");

        const label = boardView.getLabel(placement.start_row, placement.start_col);
        labelSpan.textContent = label.toString();

        return labelSpan;
    }

    function setToggleCount(button: HTMLButtonElement, count: number) {
        let span = button.querySelector(".clue-count");
        if (!span) return;
        span.textContent = `(${count})`;
    }

    function renderClues(acrossNodes: HTMLLIElement[], downNodes: HTMLLIElement[]) {
        const acrossClues = clueContainer.querySelector("#todo-across-clues") as HTMLLinkElement;
        const downClues = clueContainer.querySelector("#todo-down-clues") as HTMLLinkElement;
        
        const acrossFragment = document.createDocumentFragment();
        acrossNodes.forEach(n => acrossFragment.appendChild(n));
        
        const downFragment = document.createDocumentFragment();
        downNodes.forEach(n => downFragment.appendChild(n));
        
        acrossClues.appendChild(acrossFragment);
        downClues.appendChild(downFragment);
    }
}

export {createClue};
