import { BoardView, Clue, Direction, Placement, PlacementId} from "../models/boardView.js";

const CLUE = "clue";
const CLUE_TEXT = "clue-text";
const CLUE_LABEL = "clue-label";
const CLUE_COUNT = ".clue-count";
const ARIA_EXPANDED = "aria-expanded";
const TODO_TOGGLE = "#todo-toggle";
const TODO_ACROSS_CLUES = "#todo-across-clues";
const TODO_ACROSS_TOGGLE = "#todo-across-toggle";
const TODO_DOWN_CLUES = "#todo-down-clues";
const TODO_DOWN_TOGGLE = "#todo-down-toggle";
const FOCUS = "tabindex";

function createClue(boardView: BoardView, clueContainer: HTMLDivElement) {
    const clueMap: Map<PlacementId, Clue> = boardView.getClueMap();
    const placements = boardView.getPlacements();
    const {acrossClues, downClues} = createClues(placements, clueMap);

    renderTodoButton(acrossClues.length, downClues.length);

    const {acrossClueContainer, acrossToggle} = queryAcrossElements();
    renderClues(acrossClueContainer, acrossToggle, acrossClues);

    const {downList, downToggle} = queryDownElements();
    renderClues(downList, downToggle, downClues);

    function createClues(placements: Placement[], clueMap: Map<PlacementId, Clue>):
        {acrossClues: HTMLLIElement[], downClues: HTMLLIElement[]} {
        const acrossClues: HTMLLIElement[] = [];
        const downClues: HTMLLIElement[] = [];

        for (const placement of placements) {
            const clue = clueMap.get(placement.id);
            if (!clue) continue;
    
            const liElement = createClue(placement, clue);
        
            if (placement.direction === Direction.A) {
                acrossClues.push(liElement);
            } else {
                downClues.push(liElement);
            }
        }

        return {acrossClues, downClues};
    }

    function createClue(placement: Placement, clue: Clue): HTMLLIElement {
        const liElement = document.createElement("li");
        liElement.classList.add(CLUE);
        liElement.setAttribute(FOCUS, String(0));

        liElement.dataset.placementId = placement.id.toString();
        liElement.dataset.placementDirection = placement.direction;

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

    function renderClues(acrossClueContainer: HTMLOListElement, toggle: HTMLButtonElement, nodes: HTMLLIElement[]) {    
        const hasItems = nodes.length > 0;
    
        acrossClueContainer.hidden = !hasItems;
        toggle.setAttribute(ARIA_EXPANDED, String(hasItems));
        setToggleCount(toggle, nodes.length);

        renderClueList(acrossClueContainer, nodes);
    }

    function renderClueList(acrossClueContainer: HTMLOListElement, nodes: HTMLLIElement[]) {
        const fragment = document.createDocumentFragment();
        nodes.forEach(node => fragment.appendChild(node));
    
        acrossClueContainer.replaceChildren(fragment);
    }

    function queryAcrossElements(): {acrossClueContainer: HTMLOListElement, acrossToggle: HTMLButtonElement} {
        const acrossClueContainer = clueContainer.querySelector(TODO_ACROSS_CLUES) as HTMLOListElement;
        const acrossToggle = clueContainer.querySelector(TODO_ACROSS_TOGGLE) as HTMLButtonElement;

        return {acrossClueContainer, acrossToggle};
    }
    
    function queryDownElements(): {downList: HTMLOListElement, downToggle: HTMLButtonElement} {
        const downList = clueContainer.querySelector(TODO_DOWN_CLUES) as HTMLOListElement;
        const downToggle = clueContainer.querySelector(TODO_DOWN_TOGGLE) as HTMLButtonElement;

        return {downList, downToggle};
    }

    function renderTodoButton(todo_across_length: number, todo_down_length: number) {
        const todoToggle = clueContainer.querySelector(TODO_TOGGLE) as HTMLButtonElement;
        const totalClues = todo_across_length + todo_down_length;
        setToggleCount(todoToggle, totalClues);
    }
}

export {createClue};
