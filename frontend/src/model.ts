class Board {
    title: string;
    rows: number;
    cols: number;
    categories: string[];
    createdAt: string;
    updatedAt: string;

    constructor(title: string, rows: number, cols: number, categories: string[] , createdAt: string, updatedAt: string) {
        this.title = title;
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
    id: number;
    direction: Direction;
    start_row: number;
    start_col: number;
    length: number;

    constructor(id: number, direction: Direction, start_row: number, start_col: number, length: number) {
        this.id = id;
        this.direction = direction;
        this.start_row = start_row;
        this.start_col = start_col;
        this.length = length;
    }
}

class Cell {
    row: number;
    col: number;
    letter: string;
    placements: Map<Direction, number>

    constructor(row: number, col: number, letter: string, placements: Map<Direction, number>) {
        this.row = row;
        this.col = col;
        this.letter = letter;
        this.placements = placements
    }
}

class Clue {
    question: string;
    placement_id: number;
    direction: Direction

    constructor(question: string, placement_id: number, direction: Direction) {
        this.question = question;
        this.placement_id = placement_id;
        this.direction = direction;
    }
}

class Solution {
    placement_id: number;
    answer: string;

    constructor(placement_id: number, answer: string) {
        this.placement_id = placement_id;
        this.answer = answer;
    }
}

export {Board, Placement, Cell, Clue, Direction};