import { BoardView, Clue, Direction, Placement, PlacementId } from "../models/boardView.js";
import { createCopyButton, attachCopyBehavior } from "../app/copyButton.js";

const CLASSES = {
    clue: "clue",
    clueText: "clue-text",
    clueLabel: "clue-label",
    clueLengthLabel: "clue-length-label",
    clueContent: "clue-content",
    clueMeta: "clue-meta",
    clueShowAnswer: "clue-show-answer",
    isEmpty: "is-empty",
} as const;

const SELECTORS = {
    clueCount: ".clue-count",

    todoToggle: "#todo-toggle",
    todoAcrossToggle: "#todo-across-toggle",
    todoDownToggle: "#todo-down-toggle",

    todoAcrossClues: "#todo-across-clues",
    todoDownClues: "#todo-down-clues",
    todoSection: "#todo-section",

    solvedToggle: "#solved-toggle",
    solvedAcrossToggle: "#solved-across-toggle",
    solvedDownToggle: "#solved-down-toggle",

    solvedAcrossClues: "#solved-across-clues",
    solvedDownClues: "#solved-down-clues",
    solvedSection: "#solved-section",
} as const;

const ATTRIBUTES = {
    ariaExpanded: "aria-expanded",
} as const;

const EVENTS = {
    clueCopyReveal: "cluecopyreveal",
    clueShowAnswer: "clueshowanswer",
} as const;

const CAN_HOVER = window.matchMedia("(hover: hover)").matches;

interface ClueSectionElements {
    toggle: HTMLButtonElement;
    list: HTMLOListElement;
}

interface CluePanelElements {
    todoToggle: HTMLButtonElement;
    todoSection: HTMLDivElement;
    todoAcross: ClueSectionElements;
    todoDown: ClueSectionElements;

    solvedToggle: HTMLButtonElement;
    solvedSection: HTMLDivElement;
    solvedAcross: ClueSectionElements;
    solvedDown: ClueSectionElements;
}

function createClues(boardView: BoardView, clueContainer: HTMLDivElement): void {
    const elements: CluePanelElements = queryCluePanelElements(clueContainer);

    initSolvedSection(elements);

    const placements = boardView.getPlacements();
    const clueMap = boardView.getClueMap();
    createTodoSection(placements, clueMap, elements);

    function createTodoSection(placements: Placement[], clueMap: Map<PlacementId, Clue>, elements: CluePanelElements): void {
        const { acrossTodoClues, downTodoClues } = createTodoClues(placements, clueMap);

        renderTodoToggle(elements, acrossTodoClues.length, downTodoClues.length);
        renderTodoClues(elements.todoAcross, acrossTodoClues);
        renderTodoClues(elements.todoDown, downTodoClues);
    }

    function createTodoClues(placements: Placement[], clueMap: Map<PlacementId, Clue>): { acrossTodoClues: HTMLLIElement[]; downTodoClues: HTMLLIElement[] } {
        const acrossTodoClues: HTMLLIElement[] = [];
        const downTodoClues: HTMLLIElement[] = [];

        for (const placement of placements) {
            const clue = clueMap.get(placement.id);
            if (!clue) continue;

            const liElement = createClueElement(placement, clue);

            if (placement.direction === Direction.A) {
                acrossTodoClues.push(liElement);
            }
            else {
                downTodoClues.push(liElement);
            }
        }

        return { acrossTodoClues, downTodoClues };
    }

    function createClueElement(placement: Placement, clue: Clue): HTMLLIElement {
        const liElement = document.createElement("li");
        liElement.classList.add(CLASSES.clue);

        liElement.dataset.placementId = placement.id.toString();
        liElement.dataset.placementDirection = placement.direction;

        liElement.append(createClueFragment(placement, clue));

        liElement.addEventListener("mouseenter", () => {
            if (CAN_HOVER) {
                liElement.dispatchEvent(new CustomEvent(EVENTS.clueCopyReveal, { bubbles: true }));
            }
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

    function createLabel(startRow: number, startCol: number): HTMLSpanElement {
        const labelSpan = document.createElement("span");
        labelSpan.classList.add(CLASSES.clueLabel);

        const coord = { row: startRow, col: startCol };
        const label = boardView.getLabel(coord);
        labelSpan.textContent = label.toString();

        return labelSpan;
    }

    function createClueContent(placement: Placement, clue: Clue): HTMLSpanElement {
        const contentSpan = document.createElement("span");
        contentSpan.classList.add(CLASSES.clueContent);

        const textSpan = createClueText(clue);
        textSpan.appendChild(createClueMeta(placement.length));

        const showAnswer = createShowAnswerControl();
        contentSpan.append(textSpan, showAnswer);

        return contentSpan;
    }

    function createClueText(clue: Clue): HTMLSpanElement {
        const textSpan = document.createElement("span");
        textSpan.classList.add(CLASSES.clueText);
        textSpan.textContent = clue.question;

        return textSpan;
    }

    function createClueMeta(length: number): HTMLSpanElement {
        const metaSpan = document.createElement("span");
        metaSpan.classList.add(CLASSES.clueMeta);
        metaSpan.appendChild(createLengthLabel(length));

        return metaSpan;
    }

    function createLengthLabel(length: number): HTMLSpanElement {
        const lengthSpan = document.createElement("span");
        lengthSpan.classList.add(CLASSES.clueLengthLabel);
        lengthSpan.textContent = `(${length})`;

        return lengthSpan;
    }

    function createShowAnswerControl(): HTMLSpanElement {
        const showAnswerText = createShowAnswerText();

        showAnswerText.addEventListener("click", activate);
        showAnswerText.addEventListener("keydown", activateOnKeydown);

        return showAnswerText;

        function activate(event: Event): void {
            event.preventDefault();
            event.stopPropagation();

            showAnswerText.dispatchEvent(
                new CustomEvent(EVENTS.clueShowAnswer, { bubbles: true })
            );
        }
        
        function isActivationKey(event: KeyboardEvent): boolean {
            return event.key === "Enter" || event.key === " ";
        }

        function activateOnKeydown(event: KeyboardEvent): void {
            if (isActivationKey(event)) {
                activate(event);
            }
        }

        function createShowAnswerText(): HTMLSpanElement {
            const span = document.createElement("span");

            span.classList.add(CLASSES.clueShowAnswer);
            span.setAttribute("role", "button");
            span.tabIndex = -1;
            span.ariaLabel = "Show clue answer";
            span.textContent = "show answer";

            return span;
        }
    }
}

function queryClueSection(clueContainer: HTMLDivElement, toggleSelector: string, listSelector: string): ClueSectionElements {
    return {
        toggle: queryRequired(clueContainer, toggleSelector, HTMLButtonElement),
        list: queryRequired(clueContainer, listSelector, HTMLOListElement),
    };
}

function queryCluePanelElements(clueContainer: HTMLDivElement): CluePanelElements {
    return {
        todoToggle: queryRequired(clueContainer, SELECTORS.todoToggle, HTMLButtonElement),
        todoSection: queryRequired(clueContainer, SELECTORS.todoSection, HTMLDivElement),
        todoAcross: queryClueSection(clueContainer, SELECTORS.todoAcrossToggle, SELECTORS.todoAcrossClues),
        todoDown: queryClueSection(clueContainer, SELECTORS.todoDownToggle, SELECTORS.todoDownClues),

        solvedToggle: queryRequired(clueContainer, SELECTORS.solvedToggle, HTMLButtonElement),
        solvedSection: queryRequired(clueContainer, SELECTORS.solvedSection, HTMLDivElement),
        solvedAcross: queryClueSection(clueContainer, SELECTORS.solvedAcrossToggle, SELECTORS.solvedAcrossClues),
        solvedDown: queryClueSection(clueContainer, SELECTORS.solvedDownToggle, SELECTORS.solvedDownClues),
    };
}

// Constructor function that produces a DOM element.
type ElementConstructor<T extends Element> = {
    new (...args: any[]): T;
};

// Uses the constructor for both runtime instanceof checks and compile-time type inference.
function queryRequired<T extends Element>(root: ParentNode, selector: string, elementType: ElementConstructor<T>): T {
    const element = root.querySelector(selector);
    if (!(element instanceof elementType)) throw new Error(`Missing expected element: ${selector}`);

    return element;
}

function renderTodoClues(section: ClueSectionElements, todoClues: HTMLLIElement[]): void {
    const hasItems = todoClues.length > 0;

    section.list.hidden = !hasItems;
    section.list.classList.toggle(CLASSES.isEmpty, !hasItems);

    section.toggle.setAttribute(ATTRIBUTES.ariaExpanded, String(hasItems));
    setToggleCount(section.toggle, todoClues.length);

    renderClueList(section.list, todoClues);
}

function renderClueList(clueContainer: HTMLOListElement, nodes: HTMLLIElement[]): void {
    const fragment = document.createDocumentFragment();

    for (const node of nodes) {
        fragment.appendChild(node);
    }

    clueContainer.replaceChildren(fragment);
}

function renderTodoToggle(elements: CluePanelElements, todoAcrossLength: number, todoDownLength: number): void {
    const totalClues = todoAcrossLength + todoDownLength;
    const hasItems = totalClues > 0;

    elements.todoToggle.classList.toggle(CLASSES.isEmpty, !hasItems);
    elements.todoSection.classList.toggle(CLASSES.isEmpty, !hasItems);

    setToggleCount(elements.todoToggle, totalClues);
}

function initSolvedSection(elements: CluePanelElements): void {
    setToggleCount(elements.solvedAcross.toggle, 0);
    setToggleCount(elements.solvedDown.toggle, 0);
    setToggleCount(elements.solvedToggle, 0);

    elements.solvedAcross.toggle.classList.toggle(CLASSES.isEmpty, true);
    elements.solvedDown.toggle.classList.toggle(CLASSES.isEmpty, true);
    elements.solvedToggle.classList.toggle(CLASSES.isEmpty, true);

    elements.solvedDown.list.classList.toggle(CLASSES.isEmpty, true);
    elements.solvedAcross.list.classList.toggle(CLASSES.isEmpty, true);
    elements.solvedSection.classList.toggle(CLASSES.isEmpty, true);
}

function setToggleCount(button: HTMLButtonElement, count: number): void {
    const spanElement = button.querySelector(SELECTORS.clueCount);
    if (!spanElement) return;

    spanElement.textContent = count > 0 ? String(count) : "";
}

export { createClues };
