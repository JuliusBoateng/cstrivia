interface BoardViewDTO {
    board: Board;
    placements: Placement[];
    cells: Cell[];
    clues: Clue[];
    solutions: Solution[];
}

// Board models should be immutable. Backend authoritative
class BoardView {
    readonly board: Board;
    readonly placements: Placement[];
    readonly cells: Cell[];
    readonly clues: Clue[];
    readonly solutions: Solution[];

    // derived
    readonly cellMap: Map<string, Cell>
    readonly placementMap: Map<number, Placement>
    readonly placementStartSet: Set<string>


    private constructor(
        board: Board,
        placements: Placement[],
        cells: Cell[],
        clues: Clue[],
        solutions: Solution[]
    ) {
        this.board = board;
        this.placements = placements;
        this.cells = cells;
        this.clues = clues;
        this.solutions = solutions;
        this.cellMap = this.createCellMap(cells)
        this.placementMap = this.createPlacementMap(placements)
        this.placementStartSet = this.createPlacementStartSet(placements);
    }

    static fromDTO(dto: BoardViewDTO): BoardView {
        return new BoardView(
            dto.board,
            dto.placements,
            dto.cells,
            dto.clues,
            dto.solutions
        );
    }

    private createCoordKey(row: number, col: number): string {
        return `${row},${col}`;
    }

    private createCellMap(cells: Cell[]) {
        return new Map(
            cells.map(cell => [this.createCoordKey(cell.row, cell.col), cell])
        );
    }

    private createPlacementMap(placements: Placement[]) {
        return new Map(
            placements.map(placement => [placement.id, placement])
        );
    }

    private createPlacementStartSet(placements: Record<number, Placement>): Set<string> {
        return new Set(
            Object.values(placements).map(placement =>
                this.createCoordKey(placement.start_row, placement.start_col)
            )
        );
    }

    getCell(row: number, col: number) {
        const key = this.createCoordKey(row, col)
        return this.cellMap.get(key)
    }

    isPlacementStart(row: number, col: number): boolean {
        const key = this.createCoordKey(row, col)
        return this.placementStartSet.has(key)
    }
}

class Board {
    readonly title: string;
    readonly description: string;
    readonly rows: number;
    readonly cols: number;
    readonly categories: string[];
    readonly createdAt: string;
    readonly updatedAt: string;

    constructor(title: string, description: string, rows: number, cols: number, categories: string[] , createdAt: string, updatedAt: string) {
        this.title = title;
        this.description = description;
        this.rows = rows;
        this.cols = cols;
        this.categories = categories;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

enum Direction {
    A = "A",
    D = "D"
}

class Placement {
    readonly id: number;
    readonly direction: Direction;
    readonly start_row: number;
    readonly start_col: number;
    readonly length: number;

    constructor(id: number, direction: Direction, start_row: number, start_col: number, length: number) {
        this.id = id;
        this.direction = direction;
        this.start_row = start_row;
        this.start_col = start_col;
        this.length = length;
    }
}

class Cell {
    readonly row: number;
    readonly col: number;
    readonly letter: string;
    readonly placements: Record<Direction, number>

    constructor(row: number, col: number, letter: string, placements: Record<Direction, number>) {
        this.row = row;
        this.col = col;
        this.letter = letter;
        this.placements = placements
    }
}

class Clue {
    readonly question: string;
    readonly placement_id: number;
    readonly direction: Direction

    constructor(question: string, placement_id: number, direction: Direction) {
        this.question = question;
        this.placement_id = placement_id;
        this.direction = direction;
    }
}

class Solution {
    readonly placement_id: number;
    readonly display_answer: string;
    readonly normalized_answer: string;

    constructor(placement_id: number, display_answer: string, normalized_answer: string) {
        this.placement_id = placement_id;
        this.display_answer = display_answer;
        this.normalized_answer = normalized_answer;
    }
}

export {Board, Placement, Cell, Clue, Direction, BoardView, BoardViewDTO};