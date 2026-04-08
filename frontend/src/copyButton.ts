const COPIED_CLASS = "copied";
const COPY_ARIA = "Copy clue";
const COPIED_ARIA = "Copied clue";
const copyButtonTimeouts = new WeakMap<HTMLButtonElement, number>();


function createCopyButton(): HTMLButtonElement {
    const button = buildButton();
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

    function createCopyImg(): HTMLImageElement {
        const img = document.createElement("img");
        img.classList.add("copy-icon");
        img.src = "/static/crossword/icons/copy.svg";
        img.alt = "";
        return img;
    }

    function createCheckImg(): HTMLImageElement {
        const img = document.createElement("img");
        img.classList.add("check-icon");
        img.src = "/static/crossword/icons/check.svg";
        img.alt = "";
        return img;
    }
}

function attachCopyBehavior(button: HTMLButtonElement, textToCopy: string): void {
    const TIMEOUT_MS = 800;

    // Prevent button from stealing focus
    button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });

    button.addEventListener("click", (event) => {
        event.stopPropagation();
        void copyText();
    });

    async function copyText(): Promise<void> {
        revealCopyButton(button);

        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopiedState(button);
            setCopyButtonResetTimeout(button, TIMEOUT_MS);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
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

export { createCopyButton, attachCopyBehavior, revealCopyButton, hideCopyButton }