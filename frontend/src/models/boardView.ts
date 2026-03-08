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
    readonly placementCellMap: Map<number, Cell[]>;

    private constructor(
        board: Board,
        placements: Placement[],
        cells: Cell[],
        clues: Clue[]
    ) {
        this.board = board;

        // Invariant:
        // cells sorted by (row, col)
        // placements sorted by (start_row, start_col, direction)
        this.placements = this.sortPlacements(placements);
        this.cells = this.sortCells(cells);
        this.clues = clues;
        this.cellGrid = this.createCellGrid();
        this.labelGrid = this.createLabelGrid();
        this.placementMap = this.createPlacementMap();
        this.placementCellMap = this.createPlacementCellMap();
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

    getCellsWithPlacementId(placement_id: number): Cell[] | undefined {
        return this.placementCellMap.get(placement_id);
    }

    getPlacements(): Placement[] {
        return this.placements;
    }

    getPlacement(placement_id: number): Placement | undefined {
        return this.placementMap.get(placement_id);
    }

    private createCellGrid() {
        const rows = this.board.rows;
        const cols = this.board.cols;

        const cellGrid = Array.from({ length: rows }, () => Array(cols).fill(null))

        for (const cell of this.cells) {
            cellGrid[cell.row][cell.col] = cell;
        }

        return cellGrid;
    }

    private sortCells(cells: Cell[]): Cell[] {
        const sortedCells = [...cells]
                                    .sort((a, b) => a.row - b.row || a.col - b.col);
        return sortedCells;
    }

    private sortPlacements(placements: Placement[]): Placement[] {
        return [...placements].sort((a, b) =>
            a.start_row - b.start_row ||
            a.start_col - b.start_col ||
            a.direction === Direction.A ? -1 : 1 // Sort by direction
        );
    }

    private createPlacementMap() {
        return new Map(
            this.placements.map(placement => [placement.id, placement])
        );
    }

    private createLabelGrid(): number[][] {
        const rows = this.board.rows;
        const cols = this.board.cols;
        const labelGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
        
        let label = 1;
        for (const p of this.placements) {
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
    
    private createPlacementCellMap(): Map<number, Cell[]> {
        const map = new Map<number, Cell[]>();
    
        for (const cell of this.cells) {
            const placement_ids = Object.values(cell.placements)
            
            for (const placement_id of placement_ids) {
                if (placement_id == null) {
                    continue;
                }
                    
                if (!map.has(placement_id)) {
                    map.set(placement_id, []);
                }
                
                map.get(placement_id)!.push(cell);
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

export {BoardView, CoordKey, Placement, Direction};
