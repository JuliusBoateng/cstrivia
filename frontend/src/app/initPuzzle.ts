import { BoardDom, createBoard } from "../board/boardBuilder.js";
import { BoardView, Direction } from "../models/boardView.js";
import { SolutionView } from "../models/solutionView.js";
import { PuzzleController } from "../puzzle/puzzleController.js";
import { PuzzleRenderer } from "../puzzle/puzzleRenderer.js";
import { PuzzleSession } from "../puzzle/puzzleSession.js";
import { PuzzleValidator } from "../puzzle/puzzleValidator.js";
import { createClueRenderer } from "../clue/createClueRenderer.js";
import { createCopyButton, attachCopyBehavior, revealCopyButton } from "../copyButton.js";

function initPuzzlePage(boardView: BoardView, solutionView: SolutionView) {
  renderPuzzleHeader(boardView);
  renderPuzzleMetadata(boardView);
  renderSolutionJson(boardView, solutionView);

  initControlsToggle();
}

function initPuzzleInteraction(tableElement: HTMLTableElement, boardView: BoardView, solutionView: SolutionView, clueContainer: HTMLDivElement) {
  const puzzleController = createPuzzleController(tableElement, boardView, solutionView);
  const clueRenderer = createClueRenderer(boardView, clueContainer);
  
  clueRenderer.init(puzzleController);
  puzzleController.init(clueRenderer);

  initClearPuzzleButton(() => puzzleController.resetPuzzle());
}

function createPuzzleController(tableElement: HTMLTableElement, boardView: BoardView, solutionView: SolutionView) {
    const puzzleValidator: PuzzleValidator = new PuzzleValidator(boardView, solutionView);
    const puzzleSession: PuzzleSession = new PuzzleSession(boardView, puzzleValidator)

    const boardDom: BoardDom = createBoard(boardView, tableElement);
    const puzzleDynamic = document.querySelector(".puzzle-dynamic")!;
    puzzleDynamic.classList.add("is-ready");

    const puzzleRenderer: PuzzleRenderer = new PuzzleRenderer(boardDom)

    return new PuzzleController(tableElement, puzzleSession, puzzleRenderer, boardView);
}


function renderPuzzleHeader(boardView: BoardView) {
    const puzzleNumber = boardView.board.puzzle_number;
    const title = boardView.board.title;

    const boardTitle = document.querySelector("h1.board-title")!;
    boardTitle.textContent = title;
}

function renderPuzzleMetadata(boardView: BoardView) {
    const boardDescElement = document.querySelector(".board-desc")!;
    const desc = boardView.board.description || "";

    const puzzleMetadataElement = document.querySelector(".puzzle-metadata")!;
    const authorElement = puzzleMetadataElement.querySelector(".author")!;
    const publishedAtElement = puzzleMetadataElement.querySelector(".published-at")! as HTMLTimeElement;
    const puzzleNumberElement = puzzleMetadataElement.querySelector(".puzzle-number")!;
    const puzzleUrlCopyButton = puzzleMetadataElement.querySelector(".puzzle-url-copy-button")!;

    const author = boardView.board.author || "Anonymous Contributor";
    const iso = boardView.board.published_at;
    const formatted = formatDate(iso);
    const puzzleNumber = boardView.board.puzzle_number;

    authorElement.textContent = author;
    publishedAtElement.setAttribute("datetime", iso);
    publishedAtElement.textContent = formatted;
    puzzleNumberElement.textContent = `Puzzle #${puzzleNumber}`;

    const button = createCopyButton();
    attachCopyBehavior(button, getCanonicalUrl());
    revealCopyButton(button);
    button.classList.add("puzzle-url-copy-button");
    puzzleUrlCopyButton.replaceWith(button);

    boardDescElement.textContent = desc;
}

function renderSolutionJson(boardView: BoardView, solutionView: SolutionView) {
    const solutionJson = document.querySelector(".solution-json")!;

    const solutionExport = {
        across: {} as Record<string, string>,
        down: {} as Record<string, string>
    };
    
    const placements = boardView.getPlacements()
    for (const placement of placements) {
        const coord = { row: placement.start_row, col: placement.start_col };
        const label = boardView.getLabel(coord);
        if (label < 0) continue;
        
        const solution = solutionView.getSolution(placement.id);
        if (!solution) continue;

        const direction = (placement.direction === Direction.A) ? "across" : "down";
        const answer = solution.display_answer;
        solutionExport[direction][label] = answer;
    }
      
    const json = JSON.stringify(solutionExport, null, 2);
    solutionJson.textContent = json;
}

function formatDate(isoString: string) {
    return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(isoString));
}

function initControlsToggle() {
  const toggle = document.getElementById("controls-toggle");
  const panel = document.getElementById("controls-panel");

  if (!(toggle instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) {
    return;
  }

  toggle.addEventListener("click", () => {
    const expanded = toggle.ariaExpanded === "true";
    const next = !expanded;

    toggle.ariaExpanded = String(next);
    panel.hidden = !next;
  });
}

function initClearPuzzleButton(resetPuzzle: () => void) {
  const clearButton = document.getElementById("clear-puzzle");
  if (!(clearButton instanceof HTMLButtonElement)) return;

  const CLEAR_LABEL = "Clear puzzle";
  const CONFIRM_LABEL = "Click again to clear";
  const CONFIRM_CLASS = "confirming";
  const CONFIRM_TIMEOUT_MS = 2000;

  let confirmTimer: number | null = null;

  clearButton.addEventListener("click", handleClearClick);

  function handleClearClick(event: MouseEvent) {
    const button = event.currentTarget as HTMLButtonElement;
    const isConfirming = button.classList.contains(CONFIRM_CLASS);

    if (isConfirming) {
      exitConfirmState(button);
      resetPuzzle();
      return;
    }

    enterConfirmState(button);
  }

  function enterConfirmState(button: HTMLButtonElement) {
    if (confirmTimer !== null) {
      clearTimeout(confirmTimer);
      confirmTimer = null;
    }

    button.textContent = CONFIRM_LABEL;
    button.classList.add(CONFIRM_CLASS);

    confirmTimer = window.setTimeout(() => {
      exitConfirmState(button);
    }, CONFIRM_TIMEOUT_MS);
  }

  function exitConfirmState(button: HTMLButtonElement) {
    if (confirmTimer !== null) {
      clearTimeout(confirmTimer);
      confirmTimer = null;
    }

    button.classList.remove(CONFIRM_CLASS);
    button.textContent = CLEAR_LABEL;
  }
}

function getCanonicalUrl(): string {
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  return canonical?.href ?? window.location.href;
}

export { initPuzzlePage, initPuzzleInteraction };

