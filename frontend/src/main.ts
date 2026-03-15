import { getBoardView, getSolutionView, getTableElement, getClueContainer } from "./domLoader.js";
import { PuzzleController } from "./puzzle/puzzleController.js";
import { PuzzleRenderer } from "./puzzle/puzzleRenderer.js";
import { PuzzleSession } from "./puzzle/puzzleSession.js";
import { PuzzleValidator } from "./puzzle/puzzleValidator.js";
import { BoardDom, createBoard } from "./render/boardDomBuilder.js";
import { createClue} from "./render/clueDomBuilder.js";
import { ClueRenderer } from "./puzzle/clueRenderer.js";


import { BoardView, Clue, Direction, Placement, PlacementId} from "./models/boardView.js";
import { SolutionView } from "./models/solutionView.js";

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement: HTMLTableElement = getTableElement();
    const boardView: BoardView = getBoardView();
    const solutionView: SolutionView = getSolutionView();
    const clueContainer: HTMLDivElement = getClueContainer();

    if (boardView.board.id != solutionView.board_id) {
        throw Error("SolutionView does not match BoardView")
    }

    const puzzleController = createPuzzleController(tableElement, boardView, solutionView);
    const clueRenderer = createClueRenderer(boardView, clueContainer);
    puzzleController.setClueView(clueRenderer);
    clueRenderer.setCursorController(puzzleController);

});

function createClueRenderer(boardView: BoardView, clueContainer: HTMLDivElement) {
    createClue(boardView, clueContainer);
    return new ClueRenderer(clueContainer);
}

function createPuzzleController(tableElement: HTMLTableElement, boardView: BoardView, solutionView: SolutionView) {
    const puzzleValidator: PuzzleValidator = new PuzzleValidator(boardView, solutionView);
    const boardDom: BoardDom = createBoard(boardView, tableElement);
    const puzzleSession: PuzzleSession = new PuzzleSession(boardView, puzzleValidator)
    const puzzleRenderer: PuzzleRenderer = new PuzzleRenderer(boardDom)

    return new PuzzleController(tableElement, puzzleSession, puzzleRenderer, boardDom);
}
