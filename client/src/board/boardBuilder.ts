import { BoardView, Cell, Direction } from "../models/boardView.js";
import { Coord } from "../app/coords.js";

type CellGrid = HTMLTableCellElement[][];
type FillGrid = HTMLDivElement[][];
type InputGrid = (HTMLInputElement | null)[][];

interface BoardRefs {
  cellGrid: CellGrid;
  fillGrid: FillGrid;
  inputGrid: InputGrid;
}

const BLOCK = "block";
const CELL = "cell";
const FILL = "fill";
const LABEL = "label";
const LETTER = "letter";

function createBoard(boardView: BoardView, boardElement: HTMLTableElement): BoardRefs {
  const rows = boardView.board.rows;
  const cols = boardView.board.cols;

  const cellGrid = createGrid<HTMLTableCellElement>(rows, cols);
  const fillGrid = createGrid<HTMLDivElement>(rows, cols);
  const inputGrid = createGrid<HTMLInputElement | null>(rows, cols, null);

  boardElement.replaceChildren(createTableBodyElement());

  return { cellGrid, fillGrid, inputGrid };

  function createTableBodyElement(): HTMLTableSectionElement {
    const tbodyElement = document.createElement("tbody");

    for (let row = 0; row < rows; row++) {
      tbodyElement.appendChild(createTableRowElement(row));
    }

    return tbodyElement;
  }

  function createTableRowElement(row: number): HTMLTableRowElement {
    const rowElement = document.createElement("tr");
    rowElement.dataset.row = row.toString();

    for (let col = 0; col < cols; col++) {
      const coord = { row, col };
      const cellElement = createTableCellElement(coord);

      cellGrid[row][col] = cellElement;
      rowElement.appendChild(cellElement);
    }

    return rowElement;
  }

  function createTableCellElement(coord: Coord): HTMLTableCellElement {
    const cellElement = document.createElement("td");
    cellElement.classList.add(CELL);
    cellElement.dataset.row = coord.row.toString();
    cellElement.dataset.col = coord.col.toString();

    const fillElement = createFillElement(coord);
    cellElement.appendChild(fillElement);

    const cell: Cell | null = boardView.getCell(coord);

    if (!cell) {
      // non-interactive cell
      cellElement.classList.add(BLOCK);
      return cellElement;
    }

    setPlacementDataset(cellElement, cell);

    if (boardView.isStartingCell(coord)) {
      // add labels to placement starting cells
      fillElement.appendChild(createLabelElement(boardView.getLabel(coord)));
    }

    const inputElement = createInputElement();
    inputGrid[coord.row][coord.col] = inputElement;
    fillElement.appendChild(inputElement);

    return cellElement;
  }

  function createFillElement(coord: Coord): HTMLDivElement {
    const fillElement = document.createElement("div");
    fillElement.classList.add(FILL);
    fillGrid[coord.row][coord.col] = fillElement;

    return fillElement;
  }

  function setPlacementDataset(cellElement: HTMLTableCellElement, cell: Cell): void {
    const acrossPosition = cell.placement_positions[Direction.A];
    if (acrossPosition) {
      cellElement.dataset.acrossPlacementId = acrossPosition.placement_id.toString();
    }

    const downPosition = cell.placement_positions[Direction.D];
    if (downPosition) {
      cellElement.dataset.downPlacementId = downPosition.placement_id.toString();
    }
  }

  function createLabelElement(labelNumber: number): HTMLSpanElement {
    const labelElement = document.createElement("span");
    labelElement.classList.add(LABEL);
    labelElement.textContent = labelNumber.toString();

    return labelElement;
  }

  function createInputElement(): HTMLInputElement {
    const inputElement = document.createElement("input");
    inputElement.maxLength = 1;
    inputElement.tabIndex = -1;
    inputElement.autocomplete = "off";
    inputElement.spellcheck = false;
    inputElement.autocapitalize = "characters";
    inputElement.inputMode = "text";
    inputElement.classList.add(LETTER);

    return inputElement;
  }
}

function createGrid<T>(rows: number, cols: number, initialValue?: T): T[][] {
  // Construction-time placeholders.
  // Callers are responsible for filling required entries before use.
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => initialValue as T));
}

export { BoardRefs, CellGrid, FillGrid, InputGrid, createBoard };
