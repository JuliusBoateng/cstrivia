import { BoardDom, createBoard } from "../board/boardBuilder.js";
import { BoardView } from "../models/boardView.js";
import { SolutionView } from "../models/solutionView.js";
import { PuzzleController } from "../puzzle/puzzleController.js";
import { PuzzleRenderer } from "../puzzle/puzzleRenderer.js";
import { PuzzleSession } from "../puzzle/puzzleSession.js";
import { PuzzleValidator } from "../puzzle/puzzleValidator.js";


function createPuzzleController(tableElement: HTMLTableElement, boardView: BoardView, solutionView: SolutionView) {
    const puzzleValidator: PuzzleValidator = new PuzzleValidator(boardView, solutionView);
    const puzzleSession: PuzzleSession = new PuzzleSession(boardView, puzzleValidator)

    const boardDom: BoardDom = createBoard(boardView, tableElement);
    const puzzleRenderer: PuzzleRenderer = new PuzzleRenderer(boardDom)

    return new PuzzleController(tableElement, puzzleSession, puzzleRenderer);
}


function createPuzzleHeader(boardView: BoardView) {
    const puzzleNumber = boardView.board.puzzle_number;
    const title = boardView.board.title;

    const boardTitle = document.querySelector("h1.board-title")!;
    boardTitle.textContent = title;

    document.title = `Puzzle #${puzzleNumber}: ${title}`;
}

function createPuzzleMetadata(boardView: BoardView) {
    const puzzleMetadataElement = document.querySelector(".puzzle-metadata")!;
    const authorElement = puzzleMetadataElement.querySelector(".author")!;
    const publishedAtElement = puzzleMetadataElement.querySelector(".published-at")! as HTMLTimeElement;
    const puzzleNumberElement = puzzleMetadataElement.querySelector(".puzzle-number")!;
    const boardDescElement = puzzleMetadataElement.querySelector(".board-desc")!;

    const author = boardView.board.author || "Anonymous Contributor";
    const iso = boardView.board.published_at;
    const formatted = formatDate(iso);
    const puzzleNumber = boardView.board.puzzle_number;
    const desc = boardView.board.description || "";

    authorElement.textContent = author;
    publishedAtElement.setAttribute("datetime", iso);
    publishedAtElement.textContent = formatted;
    puzzleNumberElement.textContent = `Puzzle #${puzzleNumber}`;

    boardDescElement.textContent = desc;
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

export { createPuzzleController, createPuzzleHeader, createPuzzleMetadata };

