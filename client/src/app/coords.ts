type Coord = { row: number; col: number };
type CoordKey = string;

function createCoordKey(row: number, col: number): CoordKey {
  return `${row},${col}`;
}

export { Coord, CoordKey, createCoordKey };
