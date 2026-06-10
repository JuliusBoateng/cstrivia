import { Coord } from "../app/coords.js";

enum Direction {
  A = "A",
  D = "D",
}

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
  anagram: string;
  placement_id: PlacementId;
  direction: Direction;
};

type BoardViewDTO = {
  board: Board;
  placements: Placement[];
  cells: Cell[];
  clues: Clue[];
};

const EMPTY_LABEL = -1;
const STARTING_LABEL = 1;

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
    this.clues = clues;

    // BoardView invariant:
    // cells are stored sorted by (row, col)
    // placements are stored sorted by (start_row, start_col, direction)
    this.placements = this.sortPlacements(placements);
    this.cells = this.sortCells(cells);

    // derived
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

  getCell(coord: Coord): Cell | null {
    if (!this.isValidCoord(coord)) return null;
    return this.cellGrid[coord.row][coord.col];
  }

  isStartingCell(coord: Coord): boolean {
    if (!this.isValidCoord(coord)) return false;
    return this.labelGrid[coord.row][coord.col] > 0;
  }

  getLabel(coord: Coord): number {
    if (!this.isValidCoord(coord)) return EMPTY_LABEL;
    return this.labelGrid[coord.row][coord.col];
  }

  // cells are stored sorted by (row, col)
  getCellsWithPlacementId(placement_id: PlacementId): Cell[] | undefined {
    return this.placementCellMap.get(placement_id);
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

  getClue(placement_id: PlacementId): Clue | undefined {
    return this.clueMap.get(placement_id);
  }

  private createClueMap(clues: Clue[]): Map<PlacementId, Clue> {
    return new Map(clues.map((clue) => [clue.placement_id, clue]));
  }

  private createCellGrid(): (Cell | null)[][] {
    const rows = this.board.rows;
    const cols = this.board.cols;

    const cellGrid: (Cell | null)[][] = Array.from({ length: rows }, () => Array<Cell | null>(cols).fill(null));

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

  // Depends on placements being sorted by (start_row, start_col, direction)
  private createLabelGrid(): number[][] {
    const rows = this.board.rows;
    const cols = this.board.cols;
    const labelGrid = Array.from({ length: rows }, () => Array(cols).fill(EMPTY_LABEL));

    let label = STARTING_LABEL;
    for (const p of this.placements) {
      const r = p.start_row;
      const c = p.start_col;

      // placements can have the same start coords across directions
      if (labelGrid[r][c] !== EMPTY_LABEL) continue;

      labelGrid[r][c] = label++;
    }

    return labelGrid;
  }

  // Depends on cells being sorted by (row, col)
  private createPlacementCellMap(): Map<PlacementId, Cell[]> {
    const map = new Map<PlacementId, Cell[]>();

    for (const cell of this.cells) {
      const positions = Object.values(cell.placement_positions);

      for (const position of positions) {
        let placementCells = map.get(position.placement_id);

        if (!placementCells) {
          placementCells = [];
          map.set(position.placement_id, placementCells);
        }

        placementCells.push(cell);
      }
    }

    return map;
  }
}

export { BoardView, BoardViewDTO, Direction, Cell, Clue, Placement, PlacementId };
