import {BoardView, Placement, PlacementId} from "../models/boardView.js";
import { SolutionView } from "../models/solutionView.js";

const NFD_NORMALIZATION = "NFD";

class PuzzleValidator {
    private boardView: BoardView;
    private solutionView: SolutionView;
    private solvedPlacements: Set<PlacementId>;

    constructor(boardView: BoardView, solutionView: SolutionView) {
        this.boardView = boardView;
        this.solutionView = solutionView;
        this.solvedPlacements = new Set();
    }

    checkPlacement(letterGrid: (string | null)[][], placement: Placement): boolean {
        const placement_id = placement.id;
        
        const solution = this.solutionView.getSolution(placement_id);
        if (!solution) return false;

        const cells = this.boardView.getCellsWithPlacementId(placement_id); // cells are sorted
        if (!cells) return false;

        const answer = cells.map(cell => letterGrid[cell.row][cell.col]).join("");
        const normalized = PuzzleValidator.normalizeAnswer(answer);

        if (normalized === solution.normalized_answer) {
            this.solvedPlacements.add(placement_id); // placement input is locked once solved.
            return true;
        }
        
        return false;
    }

    isPuzzleComplete(letterGrid: (string | null)[][]): boolean {
        const placements = this.boardView.getPlacements();

        for (const placement of placements) {
            if (this.solvedPlacements.has(placement.id)) continue;
            if (!this.checkPlacement(letterGrid, placement)) return false;
        }

        return true;
    }

    // Checks if char is a Unicode letter or decimal digit
    static isLetterOrDigit(char: string): boolean {
        return /[\p{L}\p{Nd}]/u.test(char);
    }

    static isDiacriticChar(char: string): boolean {
        return /\p{M}/u.test(char);
    }

    static normalizeAnswer(raw: string): string {
        const letters = [...raw]
            .filter(c => PuzzleValidator.isLetterOrDigit(c))
            .join(""); // removes non-letters/digits
    
        const normalized = letters.normalize(NFD_NORMALIZATION);
        const stripped = [...normalized]
            .filter(c => !PuzzleValidator.isDiacriticChar(c)) // strip diacritics
            .join("");
    
        return stripped.toUpperCase();
    }
}

export {PuzzleValidator};
