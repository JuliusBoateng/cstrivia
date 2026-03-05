import {getTableElement, getBoardView, getSolutionView} from "./domLoader.js";
import {renderBoard} from "./render/boardRender.js";

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement = getTableElement();
    const boardView = getBoardView();
    const solutionView = getSolutionView();
    console.log(solutionView)

   renderBoard(tableElement, boardView);
});
