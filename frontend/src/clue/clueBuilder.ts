import { BoardView, Clue, Direction, Placement, PlacementId } from "../models/boardView.js";

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
const COPIED_CLASS = "copied";
const COPY_ARIA = "Copy clue";
const COPIED_ARIA = "Copied clue";

const copyButtonTimeouts = new WeakMap<HTMLButtonElement, number>();

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
    
        const textSpan = createLiText(clue);
        const lengthSpan = createLenLabel(placement);
        textSpan.appendChild(lengthSpan);

        const labelSpan = createLabel(placement);
        const copyButton = createCopyButton(clue.question);
        liElement.append(labelSpan, textSpan, copyButton);

        addLongPressListener(liElement, () => {
            liElement.dispatchEvent(new CustomEvent("cluecopyreveal", { bubbles: true }));
        });

        return liElement;

        function addLongPressListener(liElement: HTMLLIElement, onLongPress: () => void) {
            let timer: number | null = null;
            const LONG_PRESS_MS = 500;

            function start() {
                cancel();

                timer = window.setTimeout(() => {
                    onLongPress();
                    timer = null;
                }, LONG_PRESS_MS);
            }

            function cancel() {
                if (timer !== null) {
                    clearTimeout(timer);
                    timer = null;
                }
            }

            liElement.addEventListener("touchstart", start, { passive: true });
            liElement.addEventListener("touchend", cancel);
            liElement.addEventListener("touchcancel", cancel);
            liElement.addEventListener("touchmove", cancel);
        }
    }

    function createLenLabel(placement: Placement): HTMLSpanElement {
        const lengthSpan = document.createElement("span");
        lengthSpan.classList.add(CLUE_LENGTH_LABEL);
        lengthSpan.textContent = `(${placement.length})`;

        return lengthSpan;
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

        const coord = { row: placement.start_row, col: placement.start_col };
        const label = boardView.getLabel(coord);
        labelSpan.textContent = label.toString();

        return labelSpan;
    }

    function createCopyButton(clueText: string): HTMLButtonElement {
        const TIMEOUT_MS = 800;
        const button = buildButton();
        
        // Prevent button from stealing focus
        button.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            event.stopPropagation();
        });

        button.addEventListener("click", (event) => {
            event.stopPropagation();
            void copyClue();
        });

        return button;

        function buildButton(): HTMLButtonElement {
            const button = document.createElement("button");
            button.classList.add("clue-copy");
            button.ariaLabel = COPY_ARIA;
            button.tabIndex = -1;
            button.hidden = true;

            const copyImg = createCopyImg();
            const checkImg = createCheckImg();
            button.append(copyImg, checkImg);

            return button;
        }

        async function copyClue(): Promise<void> {
            revealCopyButton(button);

            try {
                await navigator.clipboard.writeText(clueText);
                setCopiedState(button);
                setCopyButtonResetTimeout(button, TIMEOUT_MS);
            } catch (err) {
                console.error("Failed to copy clue:", err);
            }
        }
    }

    function createCopyImg(): HTMLImageElement {
        const img = document.createElement("img");
        img.classList.add("copy-icon");
        img.src = "/static/crossword/icons/copy.svg";
        img.width = 16;
        img.height = 16;
        img.alt = "";
        return img;
    }

    function createCheckImg(): HTMLImageElement {
        const img = document.createElement("img");
        img.classList.add("check-icon");
        img.src = "/static/crossword/icons/check.svg";
        img.width = 16;
        img.height = 16;
        img.alt = "";
        return img;
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

function revealCopyButton(button: HTMLButtonElement): void {
    resetCopyButtonState(button);
    button.hidden = false;
}

function hideCopyButton(button: HTMLButtonElement): void {
    const timeoutId = copyButtonTimeouts.get(button);
    if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        copyButtonTimeouts.delete(button);
    }

    resetCopyButtonState(button);
    button.hidden = true;
}

function setCopiedState(button: HTMLButtonElement): void {
    button.classList.add(COPIED_CLASS);
    button.ariaLabel = COPIED_ARIA;
}

function resetCopyButtonState(button: HTMLButtonElement): void {
    button.classList.remove(COPIED_CLASS);
    button.ariaLabel = COPY_ARIA;
}

function setCopyButtonResetTimeout(button: HTMLButtonElement, timeoutMs: number): void {
    const existingTimeoutId = copyButtonTimeouts.get(button);
    if (existingTimeoutId !== undefined) clearTimeout(existingTimeoutId);

    const timeoutId = window.setTimeout(() => {
        resetCopyButtonState(button);
        copyButtonTimeouts.delete(button);
    }, timeoutMs);

    copyButtonTimeouts.set(button, timeoutId);
}

export {
    createClue,
    revealCopyButton,
    hideCopyButton,
};