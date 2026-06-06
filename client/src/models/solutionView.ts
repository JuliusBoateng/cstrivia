import { PlacementId } from "./boardView.js";
import { createCoordKey, CoordKey } from "../app/coords.js";

type Solution = {
  placement_id: PlacementId;
  display_answer: string;
  normalized_answer: string;
};

type Letter = {
  row: number;
  col: number;
  letter: string;
};

type SolutionViewDTO = {
  board_id: number;
  solutions: Solution[];
  letters: Letter[];
};

// Solution models should be immutable. Backend authoritative
class SolutionView {
  readonly board_id: number;
  readonly solutions: Solution[];
  readonly letters: Letter[];

  // derived
  readonly solutionMap: Map<PlacementId, Solution>;
  readonly letterMap: Map<CoordKey, Letter>;

  private constructor(board_id: number, solutions: Solution[], letters: Letter[]) {
    this.board_id = board_id;
    this.solutions = solutions;
    this.letters = letters;

    // derived
    this.solutionMap = this.createSolutionMap(solutions);
    this.letterMap = this.createLetterMap(letters);
  }

  static fromDTO(dto: SolutionViewDTO): SolutionView {
    return new SolutionView(dto.board_id, dto.solutions, dto.letters);
  }

  getSolution(placement_id: PlacementId): Solution | undefined {
    return this.solutionMap.get(placement_id);
  }

  getLetter(row: number, col: number): Letter | undefined {
    const key = createCoordKey(row, col);
    return this.letterMap.get(key);
  }

  private createSolutionMap(solutions: Solution[]): Map<PlacementId, Solution> {
    return new Map(solutions.map((s) => [s.placement_id, s]));
  }

  private createLetterMap(letters: Letter[]): Map<CoordKey, Letter> {
    return new Map(letters.map((l) => [createCoordKey(l.row, l.col), l]));
  }
}

export { SolutionView };
