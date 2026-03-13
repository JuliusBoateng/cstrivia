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

function createClueDom(boardView: BoardView) {
    const clues = boardView.clues;
}

function getClueDom(): HTMLTableElement {
    const clueDom = document.getElementById("clue");

    if (!(clueDom instanceof HTMLTableElement) || !clueDom) {
        throw Error("Clue is not available");
    }

    return clueDom;
}

function createPuzzleController(tableElement: HTMLTableElement, boardView: BoardView, solutionView: SolutionView) {
    const puzzleValidator: PuzzleValidator = new PuzzleValidator(boardView, solutionView);
    const boardDom: BoardDom = createBoard(boardView, tableElement);
    const puzzleSession: PuzzleSession = new PuzzleSession(boardView, puzzleValidator)
    const puzzleRenderer: PuzzleRenderer = new PuzzleRenderer(boardDom)

    new PuzzleController(puzzleSession, puzzleRenderer, boardDom);
}
