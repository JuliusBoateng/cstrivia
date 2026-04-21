import {Direction, Placement, BoardView, PlacementId, Coord} from "../models/boardView.js";
import {PuzzleValidator} from "./puzzleValidator.js";

type letterCount = number;

type PlacementCheckResult = {
    solved: PlacementId[];
    incorrect: PlacementId[];
}

// Persisted puzzle state stored in sessionStorage.
// Cleared automatically when the tab session ends.
type PersistedPuzzleSession = {
    version: 1;
    puzzleNumber: number;
    letterGrid: (string | null)[][];
};

class PuzzleSession {
    private activeCoord!: Coord;
    private rows: number;
    private cols: number;
    private activePlacement!: Placement;
    private activePlacementIndex!: number;
    private filledLetterCount!: Map<PlacementId, letterCount>;
    private letterGrid!: (string | null)[][];
    private boardView: BoardView;
    private puzzleValidator: PuzzleValidator;
    private solvedPlacementIds!: Set<PlacementId>;

    constructor(boardView: BoardView, puzzleValidator: PuzzleValidator) {
        this.boardView = boardView;
        this.rows = this.boardView.board.rows;
        this.cols = this.boardView.board.cols;

        this.puzzleValidator = puzzleValidator;

        const restored = this.restoreSessionState();
        if (restored) this.initRestoredSessionState();
        else this.initSessionState();
    }

    clearPuzzleSession(): void {
        sessionStorage.removeItem(this.storageKey);
        this.initSessionState();
    }

    applyPlacementSolution(placementId: number): Coord[] {
        const { placement, solution } = this.getPlacementSolution(placementId);
        const { affectedPlacements, updatedCoords } = this.writePlacementSolution(placement, solution);
    
        this.updateSolvedPlacements(affectedPlacements);
        this.saveSessionState();
    
        return updatedCoords;
    }
    
    private writePlacementSolution(placement: Placement, solution: string): { affectedPlacements: Placement[], updatedCoords: Coord[] } {
        const placementSet = new Set<Placement>();
        const updatedCoords: Coord[] = this.getPlacementCoords(placement);

        for (let i = 0; i < updatedCoords.length; i++) {
            const coord = updatedCoords[i];        
            const placements = this.boardView.getCellPlacements(coord);
            for (const p of placements) {
                placementSet.add(p);
            }
        
            const letter = solution[i];
            this.writeLetterAt(coord, letter);
        }
    
        return {
            affectedPlacements: [...placementSet],
            updatedCoords
        };
    }
    
    private getPlacementCoords(placement: Placement): Coord[] {
        const coords: Coord[] = [];
    
        const deltaRow = placement.direction === Direction.D ? 1 : 0;
        const deltaCol = placement.direction === Direction.A ? 1 : 0;
    
        let row = placement.start_row;
        let col = placement.start_col;
    
        for (let i = 0; i < placement.length; i++) {
            coords.push({ row, col });
            row += deltaRow;
            col += deltaCol;
        }
    
        return coords;
    }

    setLetter(letter: string | null): void {
        this.writeLetterAt(this.activeCoord, letter);

        const placements = this.boardView.getCellPlacements(this.activeCoord);
        this.updateSolvedPlacements(placements);

        this.saveSessionState();

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

    moveCursorRelative(rowDelta: number, colDelta: number) {
        const coord = this.getActiveCoord();
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

    movePlacementBy(offset: number) {
        const placements = this.boardView.getPlacements();
    
        const index = placements.findIndex(placement => placement.id === this.activePlacement.id);
        if (index < 0) return;
    
        const nextIndex = (index + offset + placements.length) % placements.length;
        const nextPlacement = placements[nextIndex];
        
        this.activePlacement = nextPlacement;
        this.activePlacementIndex = 0;
    
        const coord = {
            row: this.activePlacement.start_row,
            col: this.activePlacement.start_col
        } as Coord;
    
        this.moveCursor(coord);
    }

    setDirection(desired: Direction) {
        const cell = this.boardView.getCell(this.activeCoord);
        if (!cell) return;
    
        // Already in the desired direction.
        if (this.activePlacement.direction === desired) return;
    
        this.toggleDirection();
    }

    toggleDirection(): boolean {
        const cell = this.boardView.getCell(this.activeCoord);
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

    getActiveCoord(): Coord {
        return this.activeCoord;
    }

    getLetter(): string | null {
        return this.letterGrid[this.activeCoord.row][this.activeCoord.col]
    }

    getLetterAt(coord: Coord): string | null {
        return this.letterGrid[coord.row][coord.col]
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

    getPlacementResults(coord: Coord): PlacementCheckResult {
        const solved = [];
        const incorrect = [];
    
        const placements = this.boardView.getCellPlacements(coord);
    
        for (const placement of placements) {
            const isComplete = this.isPlacementComplete(placement);
            if (!isComplete) continue;
    
            const isSolved = this.solvedPlacementIds.has(placement.id);
    
            if (isSolved) solved.push(placement.id);
            else incorrect.push(placement.id);
        }
    
        return { solved, incorrect };
    }

    private updateSolvedPlacements(placements: Placement[]): void {
        for (const placement of placements) {
            const isSolved = this.isPlacementComplete(placement) &&
                this.puzzleValidator.checkPlacement(this.letterGrid, placement.id);

            if (isSolved) this.solvedPlacementIds.add(placement.id);
            else this.solvedPlacementIds.delete(placement.id);
        }
    }

    getSolvedPlacementIds() {
        return this.solvedPlacementIds;
    }

    isPuzzleComplete() {
        return this.solvedPlacementIds.size === this.boardView.getPlacements().length;
    }

    isCellEmpty(): boolean {
        return this.letterGrid[this.activeCoord.row][this.activeCoord.col] === null;
    }

    isEndOfPlacement(): boolean {
        const next = this.getCellInActivePlacement(1);
        return !next;
    }

    isBlock(coord: Coord): boolean {
        return this.boardView.getCell(coord) === null;
    }

    private getPlacementSolution(placementId: number): { placement: Placement, solution: string } {
        const placement = this.boardView.getPlacement(placementId);
        if (!placement) throw new Error("Unable to retrieve placement");
    
        const solution = this.puzzleValidator.getSolution(placementId);
        if (!solution) throw new Error("Unable to retrieve solution");
    
        if (solution.length !== placement.length) {
            throw new Error("Solution does not match placement");
        }
    
        return { placement, solution };
    }

    private writeLetterAt(coord: Coord, letter: string | null): void {
        if (this.isBlock(coord)) throw Error("Unable to write to block cell.");
    
        letter = this.validateLetter(letter);
        const prev = this.letterGrid[coord.row][coord.col];
        if (prev === letter) return;
    
        this.letterGrid[coord.row][coord.col] = letter;
        if (prev === null && letter !== null) this.adjustFilledLetterCount(coord, 1);
        if (prev !== null && letter === null) this.adjustFilledLetterCount(coord, -1);
    }

    private setCursorState(coord: Coord, placement: Placement, placementIndex: number) {
        this.activeCoord = coord;
        this.activePlacement = placement;
        this.activePlacementIndex = placementIndex;
    }

    private adjustFilledLetterCount(coord: Coord, delta: number): void {
        const cell = this.boardView.getCell(coord);
        if (!cell) return;
    
        for (const position of [cell.placement_positions.A, cell.placement_positions.D]) {
            if (!position) continue;
    
            const id = position.placement_id;
            const value = this.filledLetterCount.get(id) ?? 0;
            this.filledLetterCount.set(id, value + delta);
        }
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

    // positive offset provides next cell in placement. negative offset provides previous cell.
    private getCellInActivePlacement(offset: number): Coord | null {
        const cells = this.boardView.getCellsWithPlacementId(this.activePlacement.id);
        if (!cells) return null;

        const relativeIndex = this.activePlacementIndex + offset;
        if (relativeIndex < 0 || relativeIndex >= this.activePlacement.length) return null;
    
        const cell = cells[relativeIndex]; // cells are sorted
        return {row: cell.row, col: cell.col};
    }

    private isPlacementComplete(placement: Placement): boolean {
        const length = this.filledLetterCount.get(placement.id) ?? 0
        return length === placement.length
    }

    private get storageKey(): string {
        return `cstrivia:puzzle:${this.boardView.board.puzzle_number}`;
    }

    private saveSessionState(): void {
        const state: PersistedPuzzleSession = {
            version: 1,
            puzzleNumber: this.boardView.board.puzzle_number,
            letterGrid: this.letterGrid,
        };
    
        try {
            sessionStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (err) {
            console.error("Failed to save puzzle session:", err);
        }
    }

    private restoreSessionState(): boolean {
        try {
            const raw = sessionStorage.getItem(this.storageKey);
            if (!raw) return false;
    
            const parsed = JSON.parse(raw) as PersistedPuzzleSession;
    
            if (!this.isValidPersistedState(parsed)) {
                sessionStorage.removeItem(this.storageKey);
                return false;
            }
    
            this.letterGrid = parsed.letterGrid.map((row) => [...row]);
    
            return true;
        } catch (err) {
            console.error("Failed to restore puzzle session:", err);
            sessionStorage.removeItem(this.storageKey);
            return false;
        }
    }

    private initSessionState(): void {
        this.activePlacement = this.getInitialPlacement();
        this.activePlacementIndex = 0;
        this.activeCoord = {
            row: this.activePlacement.start_row,
            col: this.activePlacement.start_col
        };

        this.letterGrid = this.createLetterGrid();
        this.filledLetterCount = this.createFilledLetterCount();
        this.solvedPlacementIds = new Set();
    }

    private initRestoredSessionState(): void {
        this.activePlacement = this.getInitialPlacement();
        this.activePlacementIndex = 0;
        this.activeCoord = {
            row: this.activePlacement.start_row,
            col: this.activePlacement.start_col
        };

        this.rebuildFilledLetterCount();
        this.rebuildSolvedPlacementIds();
    }

    private isValidPersistedState(state: unknown): state is PersistedPuzzleSession {
        if (!state || typeof state !== "object") return false;
    
        const candidate = state as PersistedPuzzleSession;
    
        const validVersion = candidate.version === 1;
        const validPuzzleNumber = candidate.puzzleNumber === this.boardView.board.puzzle_number;
    
        const grid = candidate.letterGrid;
        const validGridRows = Array.isArray(grid) && grid.length === this.rows;
    
        const validGridCells =
            validGridRows &&
            grid.every(
                (row) =>
                    Array.isArray(row) &&
                    row.length === this.cols &&
                    row.every((cell) => cell === null || typeof cell === "string")
            );
    
        return validVersion && validPuzzleNumber && validGridCells;
    }

    private getInitialPlacement(): Placement {
        const placements = this.boardView.getPlacements();
        if (placements.length === 0) {
            throw new Error("Puzzle contains no placements.");
        }

        // start cursor on first across placement
        for (const placement of placements) {
            if (placement.direction === Direction.A) {
                return placement;
            }
        }

        return placements[0];
    }

    private createLetterGrid() {
        const letterGrid = Array.from({length: this.rows}, () => Array(this.cols).fill(null))
        return letterGrid;
    }

    private createFilledLetterCount(): Map<PlacementId, letterCount> {
        const map = new Map<PlacementId, letterCount>();

        const placements = this.boardView.getPlacements()
        for (const placement of placements) {
            map.set(placement.id, 0);
        }
    
        return map;
    }

    private rebuildFilledLetterCount(): void {
        this.filledLetterCount = this.createFilledLetterCount();
    
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.letterGrid[row][col] === null) continue;
    
                this.adjustFilledLetterCount({ row, col }, 1);
            }
        }
    }

    private rebuildSolvedPlacementIds() {
        this.solvedPlacementIds = new Set();
        this.updateSolvedPlacements(this.boardView.getPlacements());
    }
}

export {PuzzleSession};
