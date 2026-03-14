import { BoardView, Clue, Direction, Placement, PlacementId} from "../models/boardView.js";

function createClue(boardView: BoardView, clueContainer: HTMLDivElement) {
    const clueMap: Map<PlacementId, Clue> = boardView.getClueMap();
    const placements = boardView.getPlacements();
    const {acrossNodes, downNodes} = createLiElements();

    renderClues("#todo-across-clues", "#todo-across-toggle", acrossNodes);
    renderClues("#todo-down-clues", "#todo-down-toggle", downNodes);

    function createLiElements(): {acrossNodes: HTMLLIElement[], downNodes: HTMLLIElement[]} {
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

    function renderClues(listSelector: string, toggleSelector: string, nodes: HTMLLIElement[]) {
        const list = clueContainer.querySelector(listSelector) as HTMLOListElement;
        const toggle = clueContainer.querySelector(toggleSelector) as HTMLButtonElement;
    
        const hasItems = nodes.length > 0;
    
        list.hidden = !hasItems;
        toggle.setAttribute("aria-expanded", String(hasItems));
        setToggleCount(toggle, nodes.length);

        renderClueList(list, nodes);
    }

    function renderClueList(list: HTMLOListElement, nodes: HTMLLIElement[]) {
        const fragment = document.createDocumentFragment();
        nodes.forEach(node => fragment.appendChild(node));
    
        list.replaceChildren(fragment);
    }
}

export {createClue};
