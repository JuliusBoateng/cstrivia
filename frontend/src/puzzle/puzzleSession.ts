import {Direction, Placement, BoardView, PlacementId} from "../models/boardView.js";

type letterCount = number;

class PuzzleSession {
    private row: number;
    private col: number;
    private rows: number;
    private cols: number;
    private activePlacement: Placement;
    private activePlacementIndex: number;
    private filledLetterCount: Map<PlacementId, letterCount>;
    private letterGrid: (string | null)[][];
    private boardView: BoardView;

    constructor(boardView: BoardView) {
        this.boardView = boardView;
        this.rows = this.boardView.board.rows;
        this.cols = this.boardView.board.cols;

        // start cursor on first placement
        this.activePlacement = this.getInitialPlacement();
        this.activePlacementIndex = 0;
        this.row = this.activePlacement.start_row;
        this.col = this.activePlacement.start_col;
        this.filledLetterCount = this.createFilledLetterCount();

        this.letterGrid = this.createLetterGrid();
    }
    
    advanceCursor() {
        const next = this.getCellInActiveWord(1);
        if (!next) return;
    
        this.moveCursor(next.row, next.col);
    }

    reverseCursor() {
        const previous = this.getCellInActiveWord(-1);
        if (!previous) return;
    
        this.moveCursor(previous.row, previous.col);
    }

    moveCursorRelative(rowDelta: number, colDelata: number) {
        const coords = this.getCoords();
        this.moveCursor(coords.row + rowDelta, coords.col + colDelata);
    }

    moveCursor(row: number, col: number) {
        const cell = this.boardView.getCell(row, col);
        if (!cell) return;
    
        this.row = row;
        this.col = col;
    
        let direction = this.activePlacement.direction;
        let position = cell.placement_positions[direction];

        if (!position) {
            direction = (direction === Direction.A ? Direction.D : Direction.A);
            position = cell.placement_positions[direction];
        }

        if (!position) return;

        const placement = this.boardView.getPlacement(position.placement_id);
        if (!placement) return;
    
        this.activePlacement = placement;    
        this.activePlacementIndex = position.placement_index;
    }

    setDirection(desired: Direction) {
        const cell = this.boardView.getCell(this.row, this.col);
        if (!cell) return;
    
        // Already in the desired direction.
        if (this.activePlacement.direction === desired) return;
    
        this.toggleDirection();
    }

    toggleDirection() {
        const cell = this.boardView.getCell(this.row, this.col)
        if (!cell) return;

        const currentDirection = this.activePlacement.direction;
        const newDirection: Direction = (currentDirection === Direction.A ? Direction.D : Direction.A);
        
        const position = cell.placement_positions[newDirection];
        if (!position) return; // no crossing word

        const placement = this.boardView.getPlacement(position.placement_id);
        if (!placement) return;

        this.activePlacement = placement;
        this.activePlacementIndex = position.placement_index;
    }

    setLetter(letter: string | null) {
        if (this.isBlock()) {
            throw Error("Unable to write to block cell.");
        }
    
        letter = this.validateLetter(letter);
        const prev = this.letterGrid[this.row][this.col];
    
        if (prev === letter) return;
    
        this.letterGrid[this.row][this.col] = letter;
        if (prev === null && letter !== null) this.adjustLetterCount(1);
        if (prev !== null && letter === null) this.adjustLetterCount(-1);
    }

    getLetter(): string | null {
        return this.letterGrid[this.row][this.col]
    }

    isWordComplete(): boolean {
        const placement = this.activePlacement;
        const length = this.filledLetterCount.get(placement.id) ?? -1
        return length === placement.length
    }

    isCellEmpty(): boolean {
        return this.letterGrid[this.row][this.col] === null;
    }

    getActivePlacement(): Placement {
        return this.activePlacement;
    }

    getActivePlacementCoords(): { row: number; col: number }[] {
        const cells = this.boardView.getCellsWithPlacementId(this.activePlacement.id);
        if (!cells) return [];

        const coords = []
        for (const cell of cells) {
            coords.push({row: cell.row, col: cell.col});
        }
        return coords;
    }

    getCoords(): {row: number, col: number} {
        return {row: this.row, col: this.col};
    }

    private getInitialPlacement(): Placement {
        const placements = this.boardView.getPlacements();
        if (placements.length === 0) {
            throw new Error("Puzzle contains no placements.");
        }

        return placements[0];
    }

    // Regex expression that checks if a character is a Unicode or Arabic character
    private isLetterOrDigit(char: string): boolean {
        return /[\p{L}\p{Nd}]/u.test(char);
    }

    private validateLetter(letter: string | null): string | null {
        if (letter === null) return null;

        if (letter.length !== 1) {
            throw new Error("Letter must be a single character.");
        }

        const char = letter.toUpperCase();

        if (!this.isLetterOrDigit(char)) {
            throw new Error("Invalid character.");
        }

        return char;
    }

    private adjustLetterCount(delta: number) {
        const cell = this.boardView.getCell(this.row, this.col);
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
    private getCellInActiveWord(offset: number): {row: number; col: number} | null {
        const relativeIndex = this.activePlacementIndex + offset;
    
        if (relativeIndex < 0 || relativeIndex >= this.activePlacement.length) return null;
    
        const cells = this.boardView.getCellsWithPlacementId(this.activePlacement.id);
        if (!cells) return null;
    
        const cell = cells[relativeIndex]; // cells are sorted
        return {row: cell.row, col: cell.col};
    }

    private isBlock(): boolean {
        return this.boardView.getCell(this.row, this.col) === null;
    }
}

export {PuzzleSession};
