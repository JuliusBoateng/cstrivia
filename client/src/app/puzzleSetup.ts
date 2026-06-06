import { BoardView, BoardViewDTO } from "../models/boardView.js";
import { SolutionView, SolutionViewDTO } from "../models/solutionView.js";

const BOARD = "board";
const BOARD_VIEW_DTO = "board-view-dto";
const SOLUTION_VIEW_DTO = "solution-view-dto";
const CLUES = "clues";

function getBoardElement(): HTMLTableElement {
  const boardElement = document.getElementById(BOARD);

  if (!(boardElement instanceof HTMLTableElement)) {
    throw new Error("Board is not available");
  }

  return boardElement;
}

function getClueContainer(): HTMLDivElement {
  const clueContainer = document.getElementById(CLUES);

  if (!(clueContainer instanceof HTMLDivElement)) {
    throw new Error("Clues are not available");
  }

  return clueContainer;
}

function getBoardView(): BoardView {
  const dto: BoardViewDTO = getJsonContent(BOARD_VIEW_DTO);
  return BoardView.fromDTO(dto);
}

function getSolutionView(): SolutionView {
  const dto: SolutionViewDTO = getJsonContent(SOLUTION_VIEW_DTO);
  return SolutionView.fromDTO(dto);
}

function getJsonContent<T>(id: string): T {
  const element = document.getElementById(id);

  if (!element?.textContent) {
    throw new Error(`${id} missing content`);
  }

  return JSON.parse(element.textContent) as T;
}

export { getBoardElement, getBoardView, getSolutionView, getClueContainer };
