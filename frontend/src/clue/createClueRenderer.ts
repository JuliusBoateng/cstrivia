import { BoardView} from "../models/boardView.js";
import { createClue} from "../clue/clueBuilder.js";
import { ClueRenderer } from "../clue/clueRenderer.js";

function createClueRenderer(boardView: BoardView, clueContainer: HTMLDivElement) {
    createClue(boardView, clueContainer);
    return new ClueRenderer(clueContainer);
}

export {createClueRenderer}
