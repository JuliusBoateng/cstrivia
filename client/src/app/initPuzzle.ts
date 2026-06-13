import { BoardRefs, createBoard } from "../board/boardBuilder.js";
import { createClueRenderer } from "../clue/createClueRenderer.js";
import { BoardView, Direction } from "../models/boardView.js";
import { SolutionView } from "../models/solutionView.js";
import { PuzzleController } from "../puzzle/puzzleController.js";
import { PuzzleRenderer } from "../puzzle/puzzleRenderer.js";
import { PuzzleSession } from "../puzzle/puzzleSession.js";
import { PuzzleValidator } from "../puzzle/puzzleValidator.js";
import { attachCopyBehavior, createCopyButton, revealCopyButton } from "./copyButton.js";
import { queryRequired } from "./query.js";

function initPuzzlePage(boardView: BoardView, solutionView: SolutionView): void {
  renderPuzzleHeader(boardView);
  renderPuzzleMetadata(boardView);
  renderSolutionJson(boardView, solutionView);

  initControlsToggle();
}

function initPuzzleInteraction(
  boardElement: HTMLTableElement,
  boardView: BoardView,
  solutionView: SolutionView,
  clueContainer: HTMLDivElement
): void {
  const puzzleController = createPuzzleController(boardElement, boardView, solutionView);
  const clueRenderer = createClueRenderer(boardView, clueContainer);

  clueRenderer.init(puzzleController);
  puzzleController.init(clueRenderer);

  initClearPuzzleButton(() => puzzleController.resetPuzzle());
  initMobileNav(
    () => puzzleController.handleMobilePrev(),
    () => puzzleController.handleMobileNext()
  );
}

function initMobileNav(handleMobilePrev: () => void, handleMobileNext: () => void): void {
  const mobileNav = document.querySelector<HTMLElement>(".mobile-nav");
  if (!mobileNav) return;

  const mobilePrevButton = mobileNav.querySelector<HTMLButtonElement>("#mobile-prev");
  const mobileNextButton = mobileNav.querySelector<HTMLButtonElement>("#mobile-next");

  if (!mobilePrevButton || !mobileNextButton) return;

  mobilePrevButton.addEventListener("click", handleMobilePrev);
  mobileNextButton.addEventListener("click", handleMobileNext);
}

function createPuzzleController(
  boardElement: HTMLTableElement,
  boardView: BoardView,
  solutionView: SolutionView
): PuzzleController {
  const puzzleValidator: PuzzleValidator = new PuzzleValidator(boardView, solutionView);
  const puzzleSession: PuzzleSession = new PuzzleSession(boardView, puzzleValidator);

  const boardRefs: BoardRefs = createBoard(boardView, boardElement);
  const puzzleDynamic = queryRequired(document, ".puzzle-dynamic", HTMLDivElement);
  puzzleDynamic.classList.add("is-ready");

  const puzzleRenderer: PuzzleRenderer = new PuzzleRenderer(boardRefs);

  return new PuzzleController(boardElement, puzzleSession, puzzleRenderer, boardView);
}

function renderPuzzleHeader(boardView: BoardView): void {
  const title = boardView.board.title;

  const boardTitle = queryRequired(document, "h1.board-title", HTMLHeadingElement);
  boardTitle.textContent = title;
}

function renderPuzzleMetadata(boardView: BoardView): void {
  const boardDescElement = queryRequired(document, ".board-desc", HTMLParagraphElement);
  const desc = boardView.board.description || "";

  const puzzleMetadataElement = queryRequired(document, ".puzzle-metadata", HTMLDivElement);
  const authorElement = queryRequired(puzzleMetadataElement, ".author", HTMLSpanElement);
  const publishedAtElement = queryRequired(puzzleMetadataElement, ".published-at", HTMLTimeElement);
  const puzzleNumberElement = queryRequired(puzzleMetadataElement, ".puzzle-number", HTMLSpanElement);
  const puzzleUrlCopyButton = queryRequired(puzzleMetadataElement, ".puzzle-url-copy-button", HTMLButtonElement);

  const author = boardView.board.author || "Anonymous Contributor";
  const iso = boardView.board.published_at;
  const formatted = formatDate(iso);
  const puzzleNumber = boardView.board.puzzle_number;

  authorElement.textContent = author;
  publishedAtElement.setAttribute("datetime", iso);
  publishedAtElement.textContent = formatted;
  puzzleNumberElement.textContent = `Puzzle ${puzzleNumber}`;

  const button = createCopyButton();
  attachCopyBehavior(button, getCanonicalUrl());
  revealCopyButton(button);
  button.classList.add("puzzle-url-copy-button");
  puzzleUrlCopyButton.replaceWith(button);

  boardDescElement.textContent = desc;
}

function renderSolutionJson(boardView: BoardView, solutionView: SolutionView): void {
  const solutionJson = queryRequired(document, ".solution-json", HTMLPreElement);

  const solutionExport = {
    across: {} as Record<string, string>,
    down: {} as Record<string, string>,
  };

  const placements = boardView.placements;
  for (const placement of placements) {
    const coord = { row: placement.start_row, col: placement.start_col };
    const label = boardView.getLabel(coord);
    if (label < 0) continue;

    const solution = solutionView.getSolution(placement.id);
    if (!solution) continue;

    const direction = placement.direction === Direction.A ? "across" : "down";
    const answer = solution.display_answer;
    solutionExport[direction][label] = answer;
  }

  const json = JSON.stringify(solutionExport, null, 2);
  solutionJson.textContent = json;
}

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoString));
}

function initControlsToggle(): void {
  const toggle = queryRequired(document, "#controls-toggle", HTMLButtonElement);
  const panel = queryRequired(document, "#controls-panel", HTMLDivElement);

  toggle.addEventListener("click", () => {
    const expanded = toggle.ariaExpanded === "true";
    const next = !expanded;

    toggle.ariaExpanded = String(next);
    panel.hidden = !next;
  });
}

function initClearPuzzleButton(resetPuzzle: () => void): void {
  const clearButton = queryRequired(document, "#clear-puzzle", HTMLButtonElement);

  const CLEAR_LABEL = "Clear";
  const CONFIRM_LABEL = "Click again to clear";
  const CONFIRM_CLASS = "confirming";
  const CONFIRM_TIMEOUT_MS = 2000;

  let confirmTimer: number | null = null;

  clearButton.addEventListener("click", handleClearClick);

  function handleClearClick(event: MouseEvent): void {
    const button = event.currentTarget as HTMLButtonElement;
    const isConfirming = button.classList.contains(CONFIRM_CLASS);

    if (isConfirming) {
      exitConfirmState(button);
      resetPuzzle();
      return;
    }

    enterConfirmState(button);
  }

  function enterConfirmState(button: HTMLButtonElement): void {
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

  function exitConfirmState(button: HTMLButtonElement): void {
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

export { initPuzzleInteraction, initPuzzlePage };
