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
const SOLVED_TOGGLE = "#solved-toggle";
const SOLVED_ACROSS_TOGGLE = "#solved-across-toggle";
const SOLVED_DOWN_TOGGLE = "#solved-down-toggle";
const FOCUS = "tabindex";

function createClue(boardView: BoardView, clueContainer: HTMLDivElement) {
    const clueMap: Map<PlacementId, Clue> = boardView.getClueMap();
    const placements = boardView.getPlacements();
    const {acrossTodoClues, downTodoClues} = createTodoClues(placements, clueMap);

    initializeSolvedToggles();
    renderTodoToggle(acrossTodoClues.length, downTodoClues.length);

    const {acrossClueContainer, acrossTodoToggle} = queryTodoAcrossElements();
    const {downClueContainer, downTodoToggle} = queryTodoDownElements();

    renderTodoClues(acrossClueContainer, acrossTodoToggle, acrossTodoClues);
    renderTodoClues(downClueContainer, downTodoToggle, downTodoClues);

    function createTodoClues(placements: Placement[], clueMap: Map<PlacementId, Clue>):
        {acrossTodoClues: HTMLLIElement[], downTodoClues: HTMLLIElement[]} {
        const acrossTodoClues: HTMLLIElement[] = [];
        const downTodoClues: HTMLLIElement[] = [];

        for (const placement of placements) {
            const clue = clueMap.get(placement.id);
            if (!clue) continue;
    
            const liElement = createClue(placement, clue);
        
            if (placement.direction === Direction.A) {
                acrossTodoClues.push(liElement);
            } else {
                downTodoClues.push(liElement);
            }
        }

        return {acrossTodoClues, downTodoClues};
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
        let spanElement = button.querySelector(CLUE_COUNT);
        if (!spanElement) return;

        spanElement.textContent = count > 0 ? String(count) : "";
    }

    function renderTodoClues(todoClueContainer: HTMLOListElement, directionToggle: HTMLButtonElement, todoClues: HTMLLIElement[]) {    
        const hasItems = todoClues.length > 0;

        acrossClueContainer.hidden = !hasItems;
        todoClueContainer.classList.toggle("is-empty", !hasItems);

        directionToggle.setAttribute(ARIA_EXPANDED, String(hasItems));
        setToggleCount(directionToggle, todoClues.length);

        renderClueList(todoClueContainer, todoClues);
    }

    function renderClueList(acrossClueContainer: HTMLOListElement, nodes: HTMLLIElement[]) {
        const fragment = document.createDocumentFragment();
        nodes.forEach(node => fragment.appendChild(node));
    
        acrossClueContainer.replaceChildren(fragment);
    }

    function queryTodoAcrossElements(): {acrossClueContainer: HTMLOListElement, acrossTodoToggle: HTMLButtonElement} {
        const acrossClueContainer = clueContainer.querySelector(TODO_ACROSS_CLUES) as HTMLOListElement;
        const acrossTodoToggle = clueContainer.querySelector(TODO_ACROSS_TOGGLE) as HTMLButtonElement;

        return {acrossClueContainer, acrossTodoToggle};
    }
    
    function queryTodoDownElements(): {downClueContainer: HTMLOListElement, downTodoToggle: HTMLButtonElement} {
        const downClueContainer = clueContainer.querySelector(TODO_DOWN_CLUES) as HTMLOListElement;
        const downTodoToggle = clueContainer.querySelector(TODO_DOWN_TOGGLE) as HTMLButtonElement;

        return {downClueContainer, downTodoToggle};
    }

    function renderTodoToggle(todo_across_length: number, todo_down_length: number) {
        const todoToggle = clueContainer.querySelector(TODO_TOGGLE) as HTMLButtonElement;
        const totalClues = todo_across_length + todo_down_length;
        
        const hasItems = totalClues > 0;
        todoToggle.classList.toggle("is-empty", !hasItems);
        setToggleCount(todoToggle, totalClues);
    }

    function initializeSolvedToggles() {
        const solvedAcrossToggle = clueContainer.querySelector(SOLVED_ACROSS_TOGGLE) as HTMLButtonElement;
        const solvedDownToggle = clueContainer.querySelector(SOLVED_DOWN_TOGGLE) as HTMLButtonElement;
        const solvedToggle =clueContainer.querySelector(SOLVED_TOGGLE) as HTMLButtonElement;

        setToggleCount(solvedAcrossToggle, 0);
        setToggleCount(solvedDownToggle, 0);
        setToggleCount(solvedToggle, 0);

        solvedAcrossToggle.classList.toggle("is-empty", true);
        solvedDownToggle.classList.toggle("is-empty", true);
        solvedToggle.classList.toggle("is-empty", true);
    }
}

export {createClue};
