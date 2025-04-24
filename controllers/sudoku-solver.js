// Sudoku Solver - FCC Boilerplate
// Todas as funções de lógica do Sudoku devem ser implementadas aqui

class SudokuSolver {
  // Valida se o puzzle tem 81 caracteres válidos (1-9 ou .)
  validate(puzzleString) {
    if (!puzzleString) return { error: 'Required field missing' };
    if (/[^1-9.]/.test(puzzleString)) return { error: 'Invalid characters in puzzle' };
    if (puzzleString.length !== 81) return { error: 'Expected puzzle to be 81 characters long' };
    return true;
  }

  // Converte string para matriz 9x9
  stringToGrid(puzzleString) {
    return puzzleString.split('').map((v, i) => (i % 9 === 0 ? puzzleString.slice(i, i + 9).split('') : null)).filter(Boolean);
  }

  // Checa se valor pode ser colocado na linha
  checkRowPlacement(grid, row, value) {
    return !grid[row].includes(value);
  }

  // Checa se valor pode ser colocado na coluna
  checkColPlacement(grid, col, value) {
    return !grid.some(row => row[col] === value);
  }

  // Checa se valor pode ser colocado na região 3x3
  checkRegionPlacement(grid, row, col, value) {
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (grid[startRow + r][startCol + c] === value) return false;
      }
    }
    return true;
  }

  // Checa se valor pode ser colocado na posição
  checkPlacement(puzzleString, row, col, value) {
    const grid = this.stringToGrid(puzzleString);
    const conflicts = [];
    if (!this.checkRowPlacement(grid, row, value)) conflicts.push('row');
    if (!this.checkColPlacement(grid, col, value)) conflicts.push('column');
    if (!this.checkRegionPlacement(grid, row, col, value)) conflicts.push('region');
    return conflicts;
  }

  // Resolve o puzzle usando backtracking
  solve(puzzleString) {
    if (!puzzleString) return { error: 'Required field missing' };
    if (/[^1-9.]/.test(puzzleString)) return { error: 'Invalid characters in puzzle' };
    if (puzzleString.length !== 81) return { error: 'Expected puzzle to be 81 characters long' };
    let grid = this.stringToGrid(puzzleString);
    if (this._solveGrid(grid)) {
      return { solution: grid.flat().join('') };
    } else {
      return { error: 'Puzzle cannot be solved' };
    }
  }

  // Função recursiva de backtracking
  _solveGrid(grid) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === '.') {
          for (let num = 1; num <= 9; num++) {
            const value = num.toString();
            if (
              this.checkRowPlacement(grid, row, value) &&
              this.checkColPlacement(grid, col, value) &&
              this.checkRegionPlacement(grid, row, col, value)
            ) {
              grid[row][col] = value;
              if (this._solveGrid(grid)) return true;
              grid[row][col] = '.';
            }
          }
          return false;
        }
      }
    }
    return true;
  }
}

module.exports = SudokuSolver; 