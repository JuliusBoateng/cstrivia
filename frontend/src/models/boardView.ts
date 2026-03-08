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
    readonly cellGrid: Cell[][];
    readonly labelGrid: number[][];
    readonly placementMap: Map<number, Placement>;
    readonly placementCellMap: Map<number, CoordKey[]>;

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
        
        this.cellGrid = this.createCellGrid(cells);
        this.labelGrid = this.createLabelGrid(placements);
        this.placementMap = this.createPlacementMap(placements);
        this.placementCellMap = this.createPlacementCellMap(cells);
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

    static parseCoordKey(key: CoordKey): { row: number; col: number } {
        const [row, col] = key.split(",").map(Number);
        return { row, col };
    }

    getCell(row: number, col: number): Cell | null {
        return this.cellGrid[row][col]
    }

    isStartingCell(row: number, col: number): boolean {
        return this.labelGrid[row][col] > 0;
    }

    getLabel(row: number, col: number): number {
        return this.labelGrid[row][col]
    }

    getCellsWithPlacementId(placement_id: number): CoordKey[] | undefined {
        return this.placementCellMap.get(placement_id);
    }

    private createCellGrid(cells: Cell[]) {
        const rows = this.board.rows;
        const cols = this.board.cols;

        const cellGrid = Array.from({ length: rows }, () => Array(cols).fill(null))

        for (const cell of cells) {
            cellGrid[cell.row][cell.col] = cell;
        }

        return cellGrid;
    }

    private createPlacementMap(placements: Placement[]) {
        return new Map(
            placements.map(placement => [placement.id, placement])
        );
    }

    private createLabelGrid(placements: Placement[]): number[][] {
        const rows = this.board.rows;
        const cols = this.board.cols;
        const labelGrid = Array.from({ length: rows }, () => Array(cols).fill(0));

        // sort placements by row, col
        const sortedPlacements = [...placements]
                                    .sort((a, b) => a.start_row - b.start_row || a.start_col - b.start_col);
        
        let label = 1;
        for (const p of sortedPlacements) {
            const r = p.start_row;
            const c = p.start_col;

            // placements can have the same start coords accross directions
            if (labelGrid[r][c] !== 0) {
                continue;
            }

            labelGrid[r][c] = label++;
        }

        return labelGrid;
    }
    
    private createPlacementCellMap(cells: Cell[]): Map<number, CoordKey[]> {
        const map = new Map<number, CoordKey[]>();
    
        for (const {row, col, placements} of cells) {
            const coordKey = BoardView.createCoordKey(row, col);
            const placement_ids = Object.values(placements)
            
            for (const placement_id of placement_ids) {
                if (placement_id == null) {
                    continue;
                }
                    
                if (!map.has(placement_id)) {
                    map.set(placement_id, []);
                }
    
                map.get(placement_id)!.push(coordKey);
            }
        }
    
        return map;
    }
}

class Board {
    readonly id: number;
    readonly title: string;
    readonly description: string;
    readonly rows: number;
    readonly cols: number;
    readonly categories: string[];
    readonly createdAt: string;
    readonly updatedAt: string;

    constructor(id: number, title: string, description: string, rows: number, cols: number, categories: string[] , createdAt: string, updatedAt: string) {
        this.id = id;
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
    readonly placements: Record<Direction, number>

    constructor(row: number, col: number, placements: Record<Direction, number>) {
        this.row = row;
        this.col = col;
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