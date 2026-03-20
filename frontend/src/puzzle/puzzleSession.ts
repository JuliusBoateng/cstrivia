import {Direction, Placement, BoardView, PlacementId, Coord} from "../models/boardView.js";
import {PuzzleValidator} from "./puzzleValidator.js";

type letterCount = number;

type PlacementCheckResult = {
    solved: PlacementId[];
    incorrect: PlacementId[];
}

class PuzzleSession {
    private coord: Coord;
    private rows: number;
    private cols: number;
    private activePlacement: Placement;
    private activePlacementIndex: number;
    private filledLetterCount: Map<PlacementId, letterCount>;
    private letterGrid: (string | null)[][];
    private boardView: BoardView;
    private puzzleValidator: PuzzleValidator;
    private solvedPlacementIds: Set<PlacementId>;

    constructor(boardView: BoardView, puzzleValidator: PuzzleValidator) {
        this.boardView = boardView;
        this.rows = this.boardView.board.rows;
        this.cols = this.boardView.board.cols;

        this.puzzleValidator = puzzleValidator;

        // TODO move to init function
        // start cursor on first placement
        this.activePlacement = this.getInitialPlacement();
        this.activePlacementIndex = 0;
        this.coord = {row: this.activePlacement.start_row, col: this.activePlacement.start_col}
        this.filledLetterCount = this.createFilledLetterCount();

        this.letterGrid = this.createLetterGrid();
        this.solvedPlacementIds = new Set();
    }
    
    advanceCursor() {
        const next = this.getCellInActivePlacement(1);
        if (!next) return;
        
        this.moveCursor(next);
    }

    reverseCursor() {
        const previous = this.getCellInActivePlacement(-1);
        if (!previous) return;
    
        this.moveCursor(previous);
    }

    moveCursorRelative(rowDelta: number, colDelta: number) {
        const coord = this.getCoord();
        const relativeCoord = {row: coord.row + rowDelta, col: coord.col + colDelta}
        if (!this.boardView.isValidCoord(relativeCoord)) return;

        this.moveCursor(relativeCoord);
    }

    moveCursorToPlacement(placementId: PlacementId) {
        const placement = this.boardView.getPlacement(placementId);
        if (!placement) return;
    
        const coord = { row: placement.start_row, col: placement.start_col };
        const cell = this.boardView.getCell(coord);
        if (!cell) return;
    
        const position = cell.placement_positions[placement.direction];
        if (!position) return;
    
        this.setCursorState(coord, placement, position.placement_index);
    }

    moveCursor(coord: Coord) {
        const cell = this.boardView.getCell(coord);
        if (!cell) return;
    
        let direction = this.activePlacement.direction;
        let position = cell.placement_positions[direction];
    
        if (!position) {
            direction = direction === Direction.A ? Direction.D : Direction.A;
            position = cell.placement_positions[direction];
        }
    
        if (!position) return;
    
        const placement = this.boardView.getPlacement(position.placement_id);
        if (!placement) return;
    
        this.setCursorState(coord, placement, position.placement_index);
    }

    movePlacementBy(offset: number) {
        const placements = this.boardView.getPlacements();

        const index = placements.findIndex(placement => placement.id === this.activePlacement.id);
        if (index < 0) return;

        const nextIndex = (index + offset + placements.length) % placements.length;
        const nextPlacement = placements[nextIndex];

        this.activePlacement = nextPlacement;
        this.activePlacementIndex = 0;
        const coord = {row: this.activePlacement.start_row, col: this.activePlacement.start_col} as Coord;

        this.moveCursor(coord);
    }

    private setCursorState(coord: Coord, placement: Placement, placementIndex: number) {
        this.coord = coord;
        this.activePlacement = placement;
        this.activePlacementIndex = placementIndex;
    }

    setDirection(desired: Direction) {
        const cell = this.boardView.getCell(this.coord);
        if (!cell) return;
    
        // Already in the desired direction.
        if (this.activePlacement.direction === desired) return;
    
        this.toggleDirection();
    }

    toggleDirection(): boolean {
        const cell = this.boardView.getCell(this.coord);
        if (!cell) return false;

        const currentDirection = this.activePlacement.direction;
        const newDirection: Direction = (currentDirection === Direction.A ? Direction.D : Direction.A);
        
        const position = cell.placement_positions[newDirection];
        if (!position) return false; // no crossing word

        const placement = this.boardView.getPlacement(position.placement_id);
        if (!placement) return false;

        this.activePlacement = placement;
        this.activePlacementIndex = position.placement_index;
        return true
    }

    setLetter(letter: string | null) {
        if (this.isBlock()) throw Error("Unable to write to block cell.");
    
        letter = this.validateLetter(letter);
        const prev = this.letterGrid[this.coord.row][this.coord.col];
    
        if (prev === letter) return;
    
        this.letterGrid[this.coord.row][this.coord.col] = letter;
        if (prev === null && letter !== null) this.adjustLetterCount(1);
        if (prev !== null && letter === null) this.adjustLetterCount(-1);
        
        this.invalidateSolvedPlacement(this.coord);
    }

    getLetter(): string | null {
        return this.letterGrid[this.coord.row][this.coord.col]
    }

    evaluateCellPlacements(coord: Coord): PlacementCheckResult {
        const solved = [];
        const incorrect = [];

        const placements = this.boardView.getCellPlacements(coord);
        for (const placement of placements) {
            if (!this.isPlacementComplete(placement)) continue;
            
            const correct = this.puzzleValidator.checkPlacement(this.letterGrid, placement);
            if (correct) {
                this.solvedPlacementIds.add(placement.id);
                solved.push(placement.id);
            } else {
                this.solvedPlacementIds.delete(placement.id);
                incorrect.push(placement.id)
            }
        }

        return {solved, incorrect} as PlacementCheckResult;
    }

    getSolvedPlacementIds() {
        return this.solvedPlacementIds;
    }

    private invalidateSolvedPlacement(coord: Coord) {
        const placements = this.boardView.getCellPlacements(coord);
    
        for (const placement of placements) {
            this.solvedPlacementIds.delete(placement.id);
        }
    }

    isPuzzleComplete() {
        return this.solvedPlacementIds.size === this.boardView.getPlacements().length;
    }

    isCellEmpty(): boolean {
        return this.letterGrid[this.coord.row][this.coord.col] === null;
    }

    getActivePlacement(): Placement {
        return this.activePlacement;
    }

    getActivePlacementCoords(): Coord[] {
        const cells = this.boardView.getCellsWithPlacementId(this.activePlacement.id);
        if (!cells) return [];

        const coords = []
        for (const cell of cells) {
            coords.push({row: cell.row, col: cell.col});
        }
        return coords;
    }

    getCoord(): Coord {
        return this.coord;
    }

    getPlacementCells(placementId: PlacementId): Coord[] {
        const cells = this.boardView.getCellsWithPlacementId(placementId);
        if (!cells) return [];

        const coords = cells.map(cell => ({row: cell.row, col: cell.col} as Coord))
        return coords;
    }

    getPlayableCells(): Coord[] {
        return this.boardView.getCells()
            .map(cell => ({ row: cell.row, col: cell.col } as Coord));
    }

    isEndOfPlacement(): boolean {
        const next = this.getCellInActivePlacement(1);
        return !next;
    }

    private isPlacementComplete(placement: Placement): boolean {
        const length = this.filledLetterCount.get(placement.id) ?? 0
        return length === placement.length
    }

    private getInitialPlacement(): Placement {
        const placements = this.boardView.getPlacements();
        if (placements.length === 0) {
            throw new Error("Puzzle contains no placements.");
        }

        for (const placement of placements) {
            if (placement.direction === Direction.A) {
                return placement;
            }
        }

        return placements[0];
    }

    private validateLetter(letter: string | null): string | null {
        if (letter === null) return null;

        if (letter.length !== 1) {
            throw new Error("Letter must be a single character.");
        }

        const char = letter.toUpperCase();

        if (!PuzzleValidator.isLetterOrDigit(char)) {
            throw new Error("Invalid character.");
        }

        return char;
    }

    private adjustLetterCount(delta: number) {
        const cell = this.boardView.getCell(this.coord);
        if (!cell) return;
    
        const positions = cell.placement_positions;
    
        if (positions.A) {
            const id = positions.A.placement_id;
            const value = this.filledLetterCount.get(id) ?? 0;
            this.filledLetterCount.set(id, value + delta);
        }
    
        if (positions.D) {
            const id = positions.D.placement_id;
            const value = this.filledLetterCount.get(id) ?? 0;
            this.filledLetterCount.set(id, value + delta);
        }
    }
    
    private createLetterGrid() {
        const letterGrid = Array.from({length: this.rows}, () => Array(this.cols).fill(null))
        return letterGrid;
    }

    private createFilledLetterCount(): Map<PlacementId, letterCount> {
        const map = new Map();
        const placements = this.boardView.getPlacements()
        for (const placement of placements) {
            map.set(placement.id, 0);
        }
    
        return map;
    }

    // positive offset provides next cell in placement. negative offset provides previous cell.
    private getCellInActivePlacement(offset: number): Coord | null {
        const cells = this.boardView.getCellsWithPlacementId(this.activePlacement.id);
        if (!cells) return null;

        const relativeIndex = this.activePlacementIndex + offset;
        if (relativeIndex < 0 || relativeIndex >= this.activePlacement.length) return null;
    
        const cell = cells[relativeIndex]; // cells are sorted
        return {row: cell.row, col: cell.col};
    }

    private isBlock(): boolean {
        return this.boardView.getCell(this.coord) === null;
    }
}

export {PuzzleSession};
