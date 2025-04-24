// Exemplos de puzzles para o Sudoku Solver FCC

module.exports = [
  // Puzzle válido e solucionável (puzzle FCC)
  '135762984946381257728459613694517832812936745357824196589273461471698325263145879'.replace(/[3-9]/g, '.'),
  // Puzzle inválido (caracteres inválidos)
  '1.5..2.84..63.12.7.2..5.....9..1....8.2.3674.3.7.2..9..5.....1.4.2.3..6.9.7..X',
  // Puzzle inválido (tamanho incorreto)
  '1.5..2.84..63.12.7.2..5.....9..1....8.2.3674.3.7.2..9..5.....1.4.2.3..6.9.7..',
  // Puzzle impossível (mas 81 caracteres)
  '111111111222222222333333333444444444555555555666666666777777777888888888999999999',
]; 