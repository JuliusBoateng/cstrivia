import { getBoardView, getSolutionView, getTableElement } from "./domLoader.js";
import { PuzzleController } from "./puzzle/puzzleController.js";
import { PuzzleRenderer } from "./puzzle/puzzleRenderer.js";
import { PuzzleSession } from "./puzzle/puzzleSession.js";
import { PuzzleValidator } from "./puzzle/puzzleValidator.js";
import { BoardDom, createBoard } from "./render/boardDomBuilder.js";


import { BoardView, Clue, Direction, Placement, PlacementId} from "./models/boardView.js";
import { SolutionView } from "./models/solutionView.js";

document.addEventListener("DOMContentLoaded", (event) => {
    const tableElement: HTMLTableElement = getTableElement();
    const boardView: BoardView = getBoardView();
    const solutionView: SolutionView = getSolutionView();

    if (boardView.board.id != solutionView.board_id) {
        throw Error("SolutionView does not match BoardView")
    }

    createPuzzleController(tableElement, boardView, solutionView);

    const clueDom: HTMLDivElement = getClueDom();
    createClueDom(boardView, clueDom);
});

function createClueDom(boardView: BoardView, clueDom: HTMLDivElement) {
    const clueMap: Map<PlacementId, Clue> = boardView.getClueMap();
    const placements = boardView.getPlacements();

    const {acrossNodes, downNodes} = createDirectionElements();

    function createDirectionElements(): {acrossNodes: HTMLLIElement[], downNodes: HTMLLIElement[]} {
        const acrossNodes: HTMLLIElement[] = [];
        const downNodes: HTMLLIElement[] = [];

        for (const placement of placements) {
            const clue = clueMap.get(placement.id);
            if (!clue) continue;
    
            const liElement = createLiElement(placement, clue);
        
            if (placement.direction === Direction.A) {
                acrossNodes.push(liElement);
            } else {
                downNodes.push(liElement);
            }
        }

        return {acrossNodes, downNodes};
    }

    function createLiElement(placement: Placement, clue: Clue): HTMLLIElement {
        const liElement = document.createElement("li");
        liElement.classList.add("clue");

        liElement.dataset.placementId = placement.id.toString();
        liElement.dataset.direction = placement.direction;

        const textSpan = createLiText(clue);
        const labelSpan = createLabel(placement)
        liElement.append(labelSpan, textSpan);

        return liElement;
    }

    function createLiText(clue: Clue): HTMLSpanElement {
        const textSpan = document.createElement("span");
        textSpan.classList.add("clue-text");

        textSpan.textContent = clue.question;

        return textSpan;
    }

    function createLabel(placement: Placement): HTMLSpanElement {
        const labelSpan = document.createElement("span");
        labelSpan.classList.add("clue-label");

        const label = boardView.getLabel(placement.start_row, placement.start_col);
        labelSpan.textContent = label.toString();

        return labelSpan;
    }

    // function() {
    //     const acrossList = clueDom.querySelector("#todo-across-clues")!;
    //     const downList = clueDom.querySelector("#todo-down-clues")!;
        
    //     const acrossFragment = document.createDocumentFragment();
    //     acrossNodes.forEach(n => acrossFragment.appendChild(n));
        
    //     const downFragment = document.createDocumentFragment();
    //     downNodes.forEach(n => downFragment.appendChild(n));
        
    //     acrossList.appendChild(acrossFragment);
    //     downList.appendChild(downFragment);
    // }
    // Add to dom.
}

function getClueDom(): HTMLDivElement {
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
