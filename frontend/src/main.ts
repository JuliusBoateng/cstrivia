import { createPuzzleController, createPuzzleHeader, createPuzzleMetadata, createSolutionExport } from "./app/initPuzzle.js";
import { getBoardView, getClueContainer, getSolutionView, getTableElement } from "./app/puzzleSetup.js";

import { createClueRenderer } from "./clue/createClueRenderer.js";


import { BoardView } from "./models/boardView.js";
import { SolutionView } from "./models/solutionView.js";
import { PuzzleController } from "./puzzle/puzzleController.js";

const PUZZLE_PANEL = ".puzzle-panel";

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement: HTMLTableElement = getTableElement();
    const boardView: BoardView = getBoardView();
    const solutionView: SolutionView = getSolutionView();
    const clueContainer: HTMLDivElement = getClueContainer();

    if (boardView.board.id != solutionView.board_id) {
        throw Error("SolutionView does not match BoardView")
    }

    createPuzzleHeader(boardView);
    createPuzzleMetadata(boardView);
    createSolutionExport(boardView, solutionView);

    const puzzleController = createPuzzleController(tableElement, boardView, solutionView);
    const clueRenderer = createClueRenderer(boardView, clueContainer);
    puzzleController.init(clueRenderer);
    clueRenderer.setCursorController(puzzleController); // TODO add init

    const puzzlePanel = document.querySelector(PUZZLE_PANEL) as HTMLDivElement;
    setupOutsideClickHandler(puzzleController, puzzlePanel);
});

function setupOutsideClickHandler(puzzleController: PuzzleController, puzzlePanel: HTMLDivElement): void {
    document.addEventListener("pointerdown", (event: PointerEvent) => {
      if (!puzzlePanel.contains(event.target as Node)) {
        puzzleController.resetActiveUI();
      }
    });
  }