import { initPuzzlePage, initPuzzleInteraction } from "./app/initPuzzle.js";
import { getBoardView, getClueContainer, getSolutionView, getTableElement } from "./app/puzzleSetup.js";

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

    initPuzzlePage(boardView, solutionView);
    initPuzzleInteraction(tableElement, boardView, solutionView, clueContainer);
});
