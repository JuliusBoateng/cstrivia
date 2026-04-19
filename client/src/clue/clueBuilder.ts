import { BoardView, Clue, Direction, Placement, PlacementId } from "../models/boardView.js";
import { createCopyButton, attachCopyBehavior } from "../app/copyButton.js";

const CLUE = "clue";
const CLUE_TEXT = "clue-text";
const CLUE_LABEL = "clue-label";
const CLUE_LENGTH_LABEL = "clue-length-label";
const CLUE_COUNT = ".clue-count";

const TODO_TOGGLE = "#todo-toggle";
const TODO_ACROSS_TOGGLE = "#todo-across-toggle";
const TODO_DOWN_TOGGLE = "#todo-down-toggle";

const TODO_ACROSS_CLUES = "#todo-across-clues";
const TODO_DOWN_CLUES = "#todo-down-clues";
const TODO_SECTION = "#todo-section";

const SOLVED_TOGGLE = "#solved-toggle";
const SOLVED_ACROSS_TOGGLE = "#solved-across-toggle";
const SOLVED_DOWN_TOGGLE = "#solved-down-toggle";

const SOLVED_ACROSS_CLUES = "#solved-across-clues";
const SOLVED_DOWN_CLUES = "#solved-down-clues";
const SOLVED_SECTION = "#solved-section";

const ARIA_EXPANDED = "aria-expanded";

const CLUE_COPY_REVEAL_EVENT = "cluecopyreveal";
const CLUE_SHOW_ANSWER_EVENT = "clueshowanswer";

const CAN_HOVER = window.matchMedia("(hover: hover)").matches;

function createClue(boardView: BoardView, clueContainer: HTMLDivElement) {
    initSolvedSection();

    const placements = boardView.getPlacements();
    const clueMap: Map<PlacementId, Clue> = boardView.getClueMap();
    createTodoSection(placements, clueMap);

    function createTodoSection(placements: Placement[], clueMap: Map<PlacementId, Clue>) {
        const { acrossTodoClues, downTodoClues } = createTodoClues(placements, clueMap);

        renderTodoToggle(acrossTodoClues.length, downTodoClues.length);
    
        const { acrossClueContainer, acrossTodoToggle } = queryTodoAcrossElements();    
        renderTodoClues(acrossClueContainer, acrossTodoToggle, acrossTodoClues);

        const { downClueContainer, downTodoToggle } = queryTodoDownElements();
        renderTodoClues(downClueContainer, downTodoToggle, downTodoClues);
    }

    function createTodoClues(placements: Placement[], clueMap: Map<PlacementId, Clue>):
        { acrossTodoClues: HTMLLIElement[]; downTodoClues: HTMLLIElement[] } {
        const acrossTodoClues: HTMLLIElement[] = [];
        const downTodoClues: HTMLLIElement[] = [];

        for (const placement of placements) {
            const clue = clueMap.get(placement.id);
            if (!clue) continue;
    
            const liElement = createClueElement(placement, clue);
        
            if (placement.direction === Direction.A) acrossTodoClues.push(liElement);
            else downTodoClues.push(liElement);
        }

        return { acrossTodoClues, downTodoClues };
    }

    function createClueElement(placement: Placement, clue: Clue): HTMLLIElement {
        const liElement = document.createElement("li");
        liElement.classList.add(CLUE);
    
        liElement.dataset.placementId = placement.id.toString();
        liElement.dataset.placementDirection = placement.direction;
    
        const fragment: DocumentFragment = createClueFragment(placement, clue)
        liElement.append(fragment);

        liElement.addEventListener("mouseenter", () => {
            if (CAN_HOVER) liElement.dispatchEvent(new CustomEvent(CLUE_COPY_REVEAL_EVENT, { bubbles: true }));
        });

        return liElement;
    }

    function createClueFragment(placement: Placement, clue: Clue): DocumentFragment {
        const fragment: DocumentFragment = document.createDocumentFragment();
    
        const labelSpan = createLabel(placement.start_row, placement.start_col);
    
        const clueContent = createClueContent(placement, clue);
    
        const copyButton = createCopyButton();
        attachCopyBehavior(copyButton, clue.question);
    
        fragment.append(labelSpan, clueContent, copyButton);
        return fragment;
    }

    function createLabel(start_row: number, start_col: number): HTMLSpanElement {
        const labelSpan = document.createElement("span");
        labelSpan.classList.add(CLUE_LABEL);

        const coord = { row: start_row, col: start_col };
        const label = boardView.getLabel(coord);
        labelSpan.textContent = label.toString();

        return labelSpan;
    }

    function createClueContent(placement: Placement, clue: Clue): HTMLSpanElement {
        const contentSpan = document.createElement("span");
        contentSpan.classList.add("clue-content");

        const textSpan = createLiText(clue);
        const clueMeta = createClueMeta(placement.length);
        textSpan.appendChild(clueMeta);

        const showAnswer = createShowAnswerControl();
        contentSpan.append(textSpan, showAnswer);
        return contentSpan;
    }

    function createLiText(clue: Clue): HTMLSpanElement {
        const textSpan = document.createElement("span");
        textSpan.classList.add(CLUE_TEXT);
        textSpan.textContent = clue.question;
        return textSpan;
    }

    function createClueMeta(length: number): HTMLSpanElement {
        const metaSpan = document.createElement("span");
        metaSpan.classList.add("clue-meta");

        const lengthSpan = createLenLabel(length);
        metaSpan.appendChild(lengthSpan);
        return metaSpan;
    }

    function createLenLabel(length: number): HTMLSpanElement {
        const lengthSpan = document.createElement("span");
        lengthSpan.classList.add(CLUE_LENGTH_LABEL);
        lengthSpan.textContent = `(${length})`;

        return lengthSpan;
    }

    function createShowAnswerControl(): HTMLSpanElement {
        const showAnswerText = createShowAnswerText();
    
        showAnswerText.addEventListener("click", activate);
    
        showAnswerText.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.key === "Enter" || event.key === " ") activate(event);
        });
    
        return showAnswerText;

        function activate(event: Event): void {
            event.preventDefault();
            event.stopPropagation();
            
            showAnswerText.dispatchEvent(
                new CustomEvent(CLUE_SHOW_ANSWER_EVENT, { bubbles: true })
            );
        }

        function createShowAnswerText(): HTMLSpanElement {
            const span = document.createElement("span");

            span.classList.add("clue-show-answer");
            span.setAttribute("role", "button");
            span.tabIndex = -1;
            span.ariaLabel = "Show clue answer";
            span.textContent = "show answer";
    
            return span;
        }
    }

    function setToggleCount(button: HTMLButtonElement, count: number) {
        let spanElement = button.querySelector(CLUE_COUNT);
        if (!spanElement) return;

        spanElement.textContent = count > 0 ? String(count) : "";
    }

    function renderTodoClues(todoClueContainer: HTMLOListElement, directionToggle: HTMLButtonElement, todoClues: HTMLLIElement[]) {    
        const hasItems = todoClues.length > 0;

        todoClueContainer.hidden = !hasItems;
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

        return { acrossClueContainer, acrossTodoToggle };
    }

    function queryTodoDownElements(): {downClueContainer: HTMLOListElement, downTodoToggle: HTMLButtonElement} {
        const downClueContainer = clueContainer.querySelector(TODO_DOWN_CLUES) as HTMLOListElement;
        const downTodoToggle = clueContainer.querySelector(TODO_DOWN_TOGGLE) as HTMLButtonElement;

        return { downClueContainer, downTodoToggle };
    }

    function renderTodoToggle(todo_across_length: number, todo_down_length: number) {
        const todoToggle = clueContainer.querySelector(TODO_TOGGLE) as HTMLButtonElement;
        const todoSection = clueContainer.querySelector(TODO_SECTION) as HTMLDivElement;
        const totalClues = todo_across_length + todo_down_length;

        const hasItems = totalClues > 0;
        todoToggle.classList.toggle("is-empty", !hasItems);
        todoSection.classList.toggle("is-empty", !hasItems);

        setToggleCount(todoToggle, totalClues);
    }

    function initSolvedSection() {
        const solvedAcrossToggle = clueContainer.querySelector(SOLVED_ACROSS_TOGGLE) as HTMLButtonElement;
        const solvedDownToggle = clueContainer.querySelector(SOLVED_DOWN_TOGGLE) as HTMLButtonElement;
        const solvedToggle = clueContainer.querySelector(SOLVED_TOGGLE) as HTMLButtonElement;

        setToggleCount(solvedAcrossToggle, 0);
        setToggleCount(solvedDownToggle, 0);
        setToggleCount(solvedToggle, 0);

        solvedAcrossToggle.classList.toggle("is-empty", true);
        solvedDownToggle.classList.toggle("is-empty", true);
        solvedToggle.classList.toggle("is-empty", true);

        const solvedDownClues = clueContainer.querySelector(SOLVED_DOWN_CLUES) as HTMLOListElement;
        const solvedAcrossClues = clueContainer.querySelector(SOLVED_ACROSS_CLUES) as HTMLOListElement;
        const solvedSection = clueContainer.querySelector(SOLVED_SECTION) as HTMLDivElement;

        solvedDownClues.classList.toggle("is-empty", true);
        solvedAcrossClues.classList.toggle("is-empty", true);
        solvedSection.classList.toggle("is-empty", true);
    }
}

export { createClue };