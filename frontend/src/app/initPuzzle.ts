import { BoardDom, createBoard } from "../board/boardBuilder.js";
import { BoardView, Direction } from "../models/boardView.js";
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

    return new PuzzleController(tableElement, puzzleSession, puzzleRenderer, boardView);
}


function createPuzzleHeader(boardView: BoardView) {
    const puzzleNumber = boardView.board.puzzle_number;
    const title = boardView.board.title;

    const boardTitle = document.querySelector("h1.board-title")!;
    boardTitle.textContent = title;

    document.title = `Puzzle #${puzzleNumber}: ${title}`;
}

function createPuzzleMetadata(boardView: BoardView) {
    const boardDescElement = document.querySelector(".board-desc p")!;
    const desc = boardView.board.description || "";

    const puzzleMetadataElement = document.querySelector(".puzzle-metadata")!;
    const authorElement = puzzleMetadataElement.querySelector(".author")!;
    const publishedAtElement = puzzleMetadataElement.querySelector(".published-at")! as HTMLTimeElement;
    const puzzleNumberElement = puzzleMetadataElement.querySelector(".puzzle-number")!;

    const author = boardView.board.author || "Anonymous Contributor";
    const iso = boardView.board.published_at;
    const formatted = formatDate(iso);
    const puzzleNumber = boardView.board.puzzle_number;

    authorElement.textContent = author;
    publishedAtElement.setAttribute("datetime", iso);
    publishedAtElement.textContent = formatted;
    puzzleNumberElement.textContent = `Puzzle #${puzzleNumber}`;

    boardDescElement.textContent = desc;
}

function createSolutionExport(boardView: BoardView, solutionView: SolutionView) {
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

export { createPuzzleController, createPuzzleHeader, createPuzzleMetadata, createSolutionExport };

