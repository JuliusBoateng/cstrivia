import { BoardView, PlacementId } from "../models/boardView.js";
import { SolutionView } from "../models/solutionView.js";

const NFD_NORMALIZATION = "NFD";

type LetterGrid = (string | null)[][];

class PuzzleValidator {
  private boardView: BoardView;
  private solutionView: SolutionView;

  constructor(boardView: BoardView, solutionView: SolutionView) {
    this.boardView = boardView;
    this.solutionView = solutionView;
  }

  getSolution(placement_id: PlacementId): string | undefined {
    const solution = this.solutionView.getSolution(placement_id);
    if (!solution) return undefined;

    return solution.normalized_answer;
  }

  checkPlacement(letterGrid: LetterGrid, placement_id: PlacementId): boolean {
    const solution = this.solutionView.getSolution(placement_id);
    if (!solution) return false;

    const answer = this.getPlacementAnswer(letterGrid, placement_id);
    if (answer === undefined) return false;

    const normalized = PuzzleValidator.normalizeAnswer(answer);
    return normalized === solution.normalized_answer;
  }

  // Checks if char is a Unicode letter or decimal digit
  static isLetterOrDigit(char: string): boolean {
    return /[\p{L}\p{Nd}]/u.test(char);
  }

  static isDiacriticChar(char: string): boolean {
    return /\p{M}/u.test(char);
  }

  static normalizeAnswer(raw: string): string {
    const letters = [...raw].filter((c) => PuzzleValidator.isLetterOrDigit(c)).join(""); // removes non-letters/digits

    const normalized = letters.normalize(NFD_NORMALIZATION);
    const stripped = [...normalized]
      .filter((c) => !PuzzleValidator.isDiacriticChar(c)) // strip diacritics
      .join("");

    return stripped.toUpperCase();
  }

  private getPlacementAnswer(letterGrid: LetterGrid, placement_id: PlacementId): string | undefined {
    const cells = this.boardView.getCellsWithPlacementId(placement_id); // cells are stored sorted by (row, col)
    if (!cells) return undefined;

    return cells.map((cell) => letterGrid[cell.row][cell.col]).join("");
  }
}

export { PuzzleValidator, LetterGrid };
