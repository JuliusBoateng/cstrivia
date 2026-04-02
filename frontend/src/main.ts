import { createPuzzleController, createPuzzleHeader, createPuzzleMetadata, createSolutionExport, initPuzzleToolbar } from "./app/initPuzzle.js";
import { getBoardView, getClueContainer, getSolutionView, getTableElement } from "./app/puzzleSetup.js";

import { createClueRenderer } from "./clue/createClueRenderer.js";

import { BoardView } from "./models/boardView.js";
import { SolutionView } from "./models/solutionView.js";

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement: HTMLTableElement = getTableElement();
    const boardView: BoardView = getBoardView();
    const solutionView: SolutionView = getSolutionView();
    const clueContainer: HTMLDivElement = getClueContainer();

    if (boardView.board.id != solutionView.board_id) {
        throw Error("SolutionView does not match BoardView")
    }

    initPuzzleToolbar();
    createPuzzleHeader(boardView);
    createPuzzleMetadata(boardView);
    createSolutionExport(boardView, solutionView);

    const puzzleController = createPuzzleController(tableElement, boardView, solutionView);
    const clueRenderer = createClueRenderer(boardView, clueContainer);
    puzzleController.init(clueRenderer);
    clueRenderer.setCursorController(puzzleController); // TODO add init
});
