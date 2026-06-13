import { initPuzzleInteraction, initPuzzlePage } from "./app/initPuzzle.js";
import { getBoardElement, getBoardView, getClueContainer, getSolutionView } from "./app/puzzleSetup.js";

import { BoardView } from "./models/boardView.js";
import { SolutionView } from "./models/solutionView.js";

document.addEventListener("DOMContentLoaded", () => {
  const boardElement: HTMLTableElement = getBoardElement();
  const boardView: BoardView = getBoardView();
  const solutionView: SolutionView = getSolutionView();
  const clueContainer: HTMLDivElement = getClueContainer();

  if (boardView.board.id !== solutionView.board_id) {
    throw new Error("SolutionView does not match BoardView");
  }

  initPuzzlePage(boardView, solutionView);
  initPuzzleInteraction(boardElement, boardView, solutionView, clueContainer);
});
