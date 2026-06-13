import { createClues } from "../clue/clueBuilder.js";
import { ClueRenderer } from "../clue/clueRenderer.js";
import { BoardView } from "../models/boardView.js";

function createClueRenderer(boardView: BoardView, clueContainer: HTMLDivElement): ClueRenderer {
  createClues(boardView, clueContainer);
  return new ClueRenderer(clueContainer);
}

export { createClueRenderer };
