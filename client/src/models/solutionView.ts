import { BoardView, CoordKey, PlacementId } from "./boardView.js";

interface SolutionViewDTO {
    board_id: number;
    solutions: Solution[];
    letters: Letter[];
}

// Solution models should be immutable. Backend authoritative
class SolutionView {
    readonly board_id: number;
    readonly solutions: Solution[];
    readonly letters: Letter[];

    // derived
    readonly solutionMap: Map<PlacementId, Solution>
    readonly letterMap: Map<CoordKey, Letter>

    private constructor(board_id: number, solutions: Solution[], letters: Letter[]) {
        this.board_id = board_id;
        this.solutions = solutions;
        this.solutionMap = this.createSolutionMap(solutions);
        this.letters = letters;
        this.letterMap = this.createLetterMap(letters);
    }

    static fromDTO(dto: SolutionViewDTO): SolutionView {
        return new SolutionView(
            dto.board_id,
            dto.solutions,
            dto.letters
        );
    }

    getSolution(placement_id: PlacementId): Solution | undefined {
        return this.solutionMap.get(placement_id);
    }

    getLetter(row: number, col: number): Letter | undefined {
        const key = BoardView.createCoordKey(row, col)
        return this.letterMap.get(key);
    }

    private createSolutionMap(solutions: Solution[]) {
        return new Map(solutions.map(s => [s.placement_id, s]));
    }

    private createLetterMap(letters: Letter[]): Map<CoordKey, Letter> {
        return new Map(letters.map(l => 
            [BoardView.createCoordKey(l.row, l.col), l])
        );
    }
}

class Solution {
    readonly placement_id: PlacementId;
    readonly display_answer: string;
    readonly normalized_answer: string;

    constructor(placement_id: PlacementId, display_answer: string, normalized_answer: string) {
        this.placement_id = placement_id;
        this.display_answer = display_answer;
        this.normalized_answer = normalized_answer;
    }
}

class Letter {
    readonly row: number;
    readonly col: number;
    readonly letter: string;

    constructor(row: number, col: number, letter: string) {
        this.row = row;
        this.col = col;
        this.letter = letter;
    }
}

export { SolutionView };

