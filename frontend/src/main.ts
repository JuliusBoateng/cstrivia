import {getTableElement, getBoardView, getSolutionView} from "./domLoader.js";
import {PuzzleController} from "./puzzle/puzzleController.js";
import {PuzzleSession} from "./puzzle/puzzleSession.js";
import {PuzzleRenderer} from "./puzzle/puzzleRenderer.js";
import {BoardDom, createBoard} from "./render/boardDomBuilder.js";

import {BoardView} from "./models/boardView.js";
import { SolutionView } from "./models/solutionView.js";

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement: HTMLTableElement = getTableElement();
    const boardView: BoardView = getBoardView();
    const solutionView: SolutionView = getSolutionView();

    if (boardView.board.id != solutionView.board_id) {
        throw Error("SolutionView does not match BoardView")
    }

    createPuzzleController(tableElement, boardView);
});

function createPuzzleController(tableElement: HTMLTableElement, boardView: BoardView) {
    const boardDom: BoardDom = createBoard(boardView, tableElement);
    const puzzleSession: PuzzleSession = new PuzzleSession(boardView)
    const puzzleRenderer: PuzzleRenderer = new PuzzleRenderer(boardDom)

    new PuzzleController(puzzleSession, puzzleRenderer, boardDom);
}