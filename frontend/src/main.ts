import { getBoardView, getSolutionView, getTableElement } from "./domLoader.js";
import { PuzzleController } from "./puzzle/puzzleController.js";
import { PuzzleRenderer } from "./puzzle/puzzleRenderer.js";
import { PuzzleSession } from "./puzzle/puzzleSession.js";
import { PuzzleValidator } from "./puzzle/puzzleValidator.js";
import { BoardDom, createBoard } from "./render/boardDomBuilder.js";

import { BoardView } from "./models/boardView.js";
import { SolutionView } from "./models/solutionView.js";

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement: HTMLTableElement = getTableElement();
    const boardView: BoardView = getBoardView();
    const solutionView: SolutionView = getSolutionView();

    if (boardView.board.id != solutionView.board_id) {
        throw Error("SolutionView does not match BoardView")
    }

    createPuzzleController(tableElement, boardView, solutionView);
});

function createPuzzleController(tableElement: HTMLTableElement, boardView: BoardView, solutionView: SolutionView) {
    const boardDom: BoardDom = createBoard(boardView, tableElement);
    const puzzleSession: PuzzleSession = new PuzzleSession(boardView)
    const puzzleRenderer: PuzzleRenderer = new PuzzleRenderer(boardDom)
    const puzzleValidator: PuzzleValidator = new PuzzleValidator(boardView, solutionView);

    new PuzzleController(puzzleSession, puzzleRenderer, boardDom, puzzleValidator);
}
