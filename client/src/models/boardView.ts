enum Direction {
  A = "A",
  D = "D",
}

type Coord = { row: number; col: number };
type CoordKey = string;
type PlacementId = number;

type Board = {
  id: number;
  title: string;
  author: string;
  puzzle_number: number;
  published_at: string;
  description: string;
  rows: number;
  cols: number;
  categories: string[];
  created_at: string;
  updated_at: string;
};

type Placement = {
  id: PlacementId;
  direction: Direction;
  start_row: number;
  start_col: number;
  length: number;
};

type PlacementPosition = {
  placement_id: PlacementId;
  placement_index: number;
};

type Cell = {
  row: number;
  col: number;
  placement_positions: Partial<Record<Direction, PlacementPosition>>;
};

type Clue = {
  question: string;
  placement_id: PlacementId;
  direction: Direction;
};

type BoardViewDTO = {
  board: Board;
  placements: Placement[];
  cells: Cell[];
  clues: Clue[];
};

// Board models should be immutable. Backend authoritative
class BoardView {
  readonly board: Board;
  readonly placements: Placement[];
  readonly cells: Cell[]; // does not contain block cells
  readonly clues: Clue[];

  // derived
  readonly cellGrid: (Cell | null)[][];
  readonly labelGrid: number[][];
  readonly placementMap: Map<PlacementId, Placement>;
  readonly placementCellMap: Map<PlacementId, Cell[]>;
  readonly clueMap: Map<PlacementId, Clue>;

  private constructor(board: Board, placements: Placement[], cells: Cell[], clues: Clue[]) {
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
    return new BoardView(dto.board, dto.placements, dto.cells, dto.clues);
  }

  isValidCoord(coord: Coord): boolean {
    return coord.row >= 0 && coord.row < this.board.rows && coord.col >= 0 && coord.col < this.board.cols;
  }

  static createCoordKey(row: number, col: number): CoordKey {
    return `${row},${col}`;
  }

  getCell(coord: Coord): Cell | null {
    if (!this.isValidCoord(coord)) return null;
    return this.cellGrid[coord.row][coord.col];
  }

  getCells(): Cell[] {
    return this.cells;
  }

  isStartingCell(coord: Coord): boolean {
    if (!this.isValidCoord(coord)) return false;
    return this.labelGrid[coord.row][coord.col] > 0;
  }

  getLabel(coord: Coord): number {
    if (!this.isValidCoord(coord)) return -1;
    return this.labelGrid[coord.row][coord.col];
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

  getCellPlacements(coord: Coord): Placement[] {
    const cell = this.getCell(coord);
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

  getClue(placement_id: number): Clue | undefined {
    return this.clueMap.get(placement_id);
  }

  private createClueMap(clues: Clue[]): Map<PlacementId, Clue> {
    return new Map(clues.map((clue) => [clue.placement_id, clue]));
  }

  private createCellGrid() {
    const rows = this.board.rows;
    const cols = this.board.cols;

    const cellGrid = Array.from({ length: rows }, () => Array(cols).fill(null));

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
    return [...placements].sort(
      (a, b) => a.start_row - b.start_row || a.start_col - b.start_col || a.direction.localeCompare(b.direction) // Sort by direction
    );
  }

  private createPlacementMap(): Map<PlacementId, Placement> {
    return new Map(this.placements.map((placement) => [placement.id, placement]));
  }

  private createLabelGrid(): number[][] {
    const rows = this.board.rows;
    const cols = this.board.cols;
    const labelGrid = Array.from({ length: rows }, () => Array(cols).fill(-1));

    let label = 1;
    for (const p of this.placements) {
      const r = p.start_row;
      const c = p.start_col;

      // placements can have the same start coords across directions
      if (labelGrid[r][c] !== -1) continue;

      labelGrid[r][c] = label++;
    }

    return labelGrid;
  }

  private createPlacementCellMap(): Map<PlacementId, Cell[]> {
    const map = new Map<number, Cell[]>();

    for (const cell of this.cells) {
      const placement_positions = Object.values(cell.placement_positions);

      for (const position of placement_positions) {
        // cells sorted by (row, col)
        if (!map.has(position.placement_id)) {
          map.set(position.placement_id, []);
        }

        map.get(position.placement_id)!.push(cell);
      }
    }

    return map;
  }
}

export { BoardView, Cell, Clue, Coord, CoordKey, Direction, Placement, PlacementId };
