interface BoardViewDTO {
    board: Board;
    placements: Placement[];
    cells: Cell[];
    clues: Clue[];
}

type CoordKey = string;

// Board models should be immutable. Backend authoritative
class BoardView {
    readonly board: Board;
    readonly placements: Placement[];
    readonly cells: Cell[];
    readonly clues: Clue[];

    // derived
    readonly cellMap: Map<CoordKey, Cell>
    readonly placementMap: Map<number, Placement>
    readonly placementStartSet: Set<CoordKey>
    readonly labelMap: Map<CoordKey, number>

    private constructor(
        board: Board,
        placements: Placement[],
        cells: Cell[],
        clues: Clue[]
    ) {
        this.board = board;
        this.placements = placements;
        this.cells = cells;
        this.clues = clues;
        
        this.cellMap = this.createCellMap(cells);
        this.placementMap = this.createPlacementMap(placements);
        this.placementStartSet = this.createPlacementStartSet(placements);
        this.labelMap = this.createLabelMap(placements);
    }

    static fromDTO(dto: BoardViewDTO): BoardView {
        return new BoardView(
            dto.board,
            dto.placements,
            dto.cells,
            dto.clues
        );
    }

    static createCoordKey(row: number, col: number): CoordKey {
        return `${row},${col}`;
    }

    getCell(row: number, col: number): Cell | undefined {
        const key = BoardView.createCoordKey(row, col)
        return this.cellMap.get(key)
    }

    isPlacementStart(row: number, col: number): boolean {
        const key = BoardView.createCoordKey(row, col)
        return this.placementStartSet.has(key)
    }

    getLabel(row: number, col: number): number | undefined {
        const key = BoardView.createCoordKey(row, col)
        return this.labelMap.get(key)
    }

    private createCellMap(cells: Cell[]) {
        return new Map(
            cells.map(c => 
                [BoardView.createCoordKey(c.row, c.col), c])
        );
    }

    private createPlacementMap(placements: Placement[]) {
        return new Map(
            placements.map(placement => [placement.id, placement])
        );
    }

    private createPlacementStartSet(placements: Placement[]): Set<CoordKey> {
        return new Set(placements.map(p => 
                BoardView.createCoordKey(p.start_row, p.start_col)
            )
        );
    }

    private createLabelMap(placements: Placement[]): Map<CoordKey, number> {
        const sortedPlacements = [...placements].sort((a, b) => 
                a.start_row - b.start_row || a.start_col - b.start_col
        );
    
        let label = 1;
        const labelMap = new Map<CoordKey, number>();    
        for (const placement of sortedPlacements) {
            const key = BoardView.createCoordKey(placement.start_row, placement.start_col);
    
            // Across + Down share the same label if they start on the same square
            if (!labelMap.has(key)) {
                labelMap.set(key, label++);
            }
        }
    
        return labelMap;
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

export {BoardView, CoordKey, Direction};