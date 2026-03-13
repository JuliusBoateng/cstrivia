interface BoardViewDTO {
    board: Board;
    placements: Placement[];
    cells: Cell[];
    clues: Clue[];
}

type Coord = {row: number, col: number}
type CoordKey = string;
type PlacementId = number;

// Board models should be immutable. Backend authoritative
class BoardView {
    readonly board: Board;
    readonly placements: Placement[];
    readonly cells: Cell[]; // does not contain block cells
    readonly clues: Clue[];

    // derived
    readonly cellGrid: (Cell | null)[][];;
    readonly labelGrid: number[][];
    readonly placementMap: Map<PlacementId, Placement>;
    readonly placementCellMap: Map<PlacementId, Cell[]>;
    readonly clueMap: Map<PlacementId, Clue>;

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
        this.clueMap = this.createClueMap(clues);
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

    static parseCoordKey(key: CoordKey): Coord {
        const [row, col] = key.split(",").map(Number);
        return { row, col } as Coord;
    }

    getCell(row: number, col: number): Cell | null {
        return this.cellGrid[row][col]
    }

    getCells(): Cell[] {
        return this.cells;
    }

    isStartingCell(row: number, col: number): boolean {
        return this.labelGrid[row][col] > 0;
    }

    getLabel(row: number, col: number): number {
        return this.labelGrid[row][col]
    }

    getCellsWithPlacementId(placement_id: PlacementId): Cell[] | undefined {
        return this.placementCellMap.get(placement_id);
    }

    getPlacements(): Placement[] {
        return this.placements;
    }

    getPlacement(placement_id: PlacementId): Placement | undefined {
        return this.placementMap.get(placement_id);
    }

    getCellPlacements(row: number, col: number): Placement[] {
        const cell = this.getCell(row, col);
        if (!cell) return [];
    
        const placements = [];
        const positions = Object.values(cell.placement_positions);
        for (const position of positions) {
            const placement = this.getPlacement(position.placement_id);
            if (placement) placements.push(placement);
        }
    
        return placements;
    }

    getClueMap(): Map<PlacementId, Clue> {
        return this.clueMap;
    }

    private createClueMap(clues: Clue[]): Map<PlacementId, Clue> {
        return new Map(clues.map(clue => [clue.placement_id, clue]));
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
        const sortedCells = [...cells].sort((a, b) => a.row - b.row || a.col - b.col);
        return sortedCells;
    }

    private sortPlacements(placements: Placement[]): Placement[] {
        return [...placements].sort((a, b) =>
            (a.start_row - b.start_row) ||
            (a.start_col - b.start_col) ||
            (a.direction.localeCompare(b.direction)) // Sort by direction
        );
    }

    private createPlacementMap(): Map<PlacementId, Placement> {
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

            // placements can have the same start coords across directions
            if (labelGrid[r][c] !== 0) {
                continue;
            }

            labelGrid[r][c] = label++;
        }

        return labelGrid;
    }
    
    private createPlacementCellMap(): Map<PlacementId, Cell[]> {
        const map = new Map<number, Cell[]>();
    
        for (const cell of this.cells) {
            const placement_positions = Object.values(cell.placement_positions)
            
            for (const position of placement_positions) { // cells sorted by (row, col)
                if (!map.has(position.placement_id)) {
                    map.set(position.placement_id, []);
                }
                
                map.get(position.placement_id)!.push(cell);
            }
        }
    
        return map;
    }
}

class Board {
    readonly id: number;
    readonly title: string;
    readonly puzzle_number: number;
    readonly published: boolean;
    readonly description: string;
    readonly rows: number;
    readonly cols: number;
    readonly categories: string[];
    readonly createdAt: string;
    readonly updatedAt: string;

    constructor(id: number, title: string, puzzle_number: number, published: boolean, description: string, rows: number, cols: number, categories: string[] , createdAt: string, updatedAt: string) {
        this.id = id;
        this.title = title;
        this.puzzle_number = puzzle_number;
        this.published = published;
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

class PlacementPosition {
    placement_id: PlacementId;
    placement_index: number;

    constructor(placement_id: PlacementId, placement_index: number){
        this.placement_id = placement_id;
        this.placement_index = placement_index;
    }
}

class Cell {
    readonly row: number;
    readonly col: number;
    readonly placement_positions: Record<Direction, PlacementPosition>

    constructor(row: number, col: number, placement_positions: Record<Direction, PlacementPosition>) {
        this.row = row;
        this.col = col;
        this.placement_positions = placement_positions;
    }
}

class Clue {
    readonly question: string;
    readonly placement_id: PlacementId;
    readonly direction: Direction

    constructor(question: string, placement_id: PlacementId, direction: Direction) {
        this.question = question;
        this.placement_id = placement_id;
        this.direction = direction;
    }
}

export {BoardView, CoordKey, Placement, Direction, PlacementId, Coord, Clue};
