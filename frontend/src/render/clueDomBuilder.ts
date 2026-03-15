import { BoardView, Clue, Direction, Placement, PlacementId} from "../models/boardView.js";

const CLUE = "clue";
const CLUE_TEXT = "clue-text";
const CLUE_LABEL = "clue-label";
const CLUE_COUNT = ".clue-count";
const ARIA_EXPANDED = "aria-expanded";
const TODO_ACROSS_CLUES = "#todo-across-clues";
const TODO_ACROSS_TOGGLE = "#todo-across-toggle";
const TODO_DOWN_CLUES = "#todo-down-clues";
const TODO_DOWN_TOGGLE = "#todo-down-toggle";

function createClue(boardView: BoardView, clueContainer: HTMLDivElement) {
    const clueMap: Map<PlacementId, Clue> = boardView.getClueMap();
    const placements = boardView.getPlacements();
    const {acrossNodes, downNodes} = createLiElements(placements, clueMap);

    const {acrossList, acrossToggle} = queryAcrossElements();
    const {downList, downToggle} = queryDownElements();

    renderClues(acrossList, acrossToggle, acrossNodes);
    renderClues(downList, downToggle, downNodes);

    function createLiElements(placements: Placement[], clueMap: Map<PlacementId, Clue>):
        {acrossNodes: HTMLLIElement[], downNodes: HTMLLIElement[]} {
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
        liElement.classList.add(CLUE);

        liElement.dataset.placementId = placement.id.toString();
        liElement.dataset.direction = placement.direction;

        const textSpan = createLiText(clue);
        const labelSpan = createLabel(placement)
        liElement.append(labelSpan, textSpan);

        return liElement;
    }

    function createLiText(clue: Clue): HTMLSpanElement {
        const textSpan = document.createElement("span");
        textSpan.classList.add(CLUE_TEXT);

        textSpan.textContent = clue.question;

        return textSpan;
    }

    function createLabel(placement: Placement): HTMLSpanElement {
        const labelSpan = document.createElement("span");
        labelSpan.classList.add(CLUE_LABEL);

        const coord = {row: placement.start_row, col: placement.start_col}
        const label = boardView.getLabel(coord);
        labelSpan.textContent = label.toString();

        return labelSpan;
    }

    function setToggleCount(button: HTMLButtonElement, count: number) {
        let span = button.querySelector(CLUE_COUNT);
        if (!span) return;
        span.textContent = `(${count})`;
    }

    function renderClues(list: HTMLOListElement, toggle: HTMLButtonElement, nodes: HTMLLIElement[]) {    
        const hasItems = nodes.length > 0;
    
        list.hidden = !hasItems;
        toggle.setAttribute(ARIA_EXPANDED, String(hasItems));
        setToggleCount(toggle, nodes.length);

        renderClueList(list, nodes);
    }

    function renderClueList(list: HTMLOListElement, nodes: HTMLLIElement[]) {
        const fragment = document.createDocumentFragment();
        nodes.forEach(node => fragment.appendChild(node));
    
        list.replaceChildren(fragment);
    }

    function queryAcrossElements(): {acrossList: HTMLOListElement, acrossToggle: HTMLButtonElement} {
        const acrossList = clueContainer.querySelector(TODO_ACROSS_CLUES) as HTMLOListElement;
        const acrossToggle = clueContainer.querySelector(TODO_ACROSS_TOGGLE) as HTMLButtonElement;

        return {acrossList, acrossToggle};
    }
    
    function queryDownElements(): {downList: HTMLOListElement, downToggle: HTMLButtonElement} {
        const downList = clueContainer.querySelector(TODO_DOWN_CLUES) as HTMLOListElement;
        const downToggle = clueContainer.querySelector(TODO_DOWN_TOGGLE) as HTMLButtonElement;

        return {downList, downToggle};
    }
}

export {createClue};
