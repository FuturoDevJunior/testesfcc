'use strict';

const expect = require('chai').expect;
const ConvertHandler = require('../controllers/convertHandler.js');
const { randomUUID } = require('crypto');
const mongoose = require('mongoose');
const SudokuSolver = require('../controllers/sudoku-solver.js');

// In-memory store for issues by project
const issuesDB = {};

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  comments: { type: [String], default: [] }
});
BookSchema.virtual('commentcount').get(function() {
  return this.comments.length;
});
BookSchema.set('toJSON', { virtuals: true });
const Book = mongoose.model('Book', BookSchema);

// Conexão MongoDB
mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });

module.exports = function (app) {
  
  let convertHandler = new ConvertHandler();
  const solver = new SudokuSolver();

  app.get('/api/convert', (req, res) => {
    const input = req.query.input;
    if (!input) return res.status(400).send('input required');

    const initNum = convertHandler.getNum(input);
    const initUnit = convertHandler.getUnit(input);

    const invalidNum = initNum === 'invalid number';
    const invalidUnit = initUnit === 'invalid unit';

    if (invalidNum && invalidUnit) return res.json({ error: 'invalid number and unit' });
    if (invalidNum) return res.json({ error: 'invalid number' });
    if (invalidUnit) return res.json({ error: 'invalid unit' });

    const returnNum = convertHandler.convert(initNum, initUnit);
    const returnUnit = convertHandler.getReturnUnit(initUnit);
    const string = convertHandler.getString(initNum, initUnit, returnNum, returnUnit);

    res.json({
      initNum,
      initUnit,
      returnNum,
      returnUnit,
      string
    });
  });

  // === PERSONAL LIBRARY ===
  // POST /api/books - Adiciona livro
  app.post('/api/books', async (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(200).send('missing required field title');
    try {
      const book = new Book({ title });
      await book.save();
      res.json({ _id: book._id, title: book.title, commentcount: book.commentcount });
    } catch (err) {
      res.status(500).send('error saving book');
    }
  });

  // GET /api/books - Lista todos os livros
  app.get('/api/books', async (req, res) => {
    const books = await Book.find({}, 'title comments');
    res.json(books.map(b => ({ _id: b._id, title: b.title, commentcount: b.commentcount })));
  });

  // GET /api/books/:id - Detalha um livro
  app.get('/api/books/:id', async (req, res) => {
    try {
      const book = await Book.findById(req.params.id);
      if (!book) return res.status(200).send('no book exists');
      res.json({ _id: book._id, title: book.title, comments: book.comments });
    } catch {
      res.status(200).send('no book exists');
    }
  });

  // POST /api/books/:id - Adiciona comentário
  app.post('/api/books/:id', async (req, res) => {
    const { comment } = req.body;
    if (!comment) return res.status(200).send('missing required field comment');
    try {
      const book = await Book.findById(req.params.id);
      if (!book) return res.status(200).send('no book exists');
      book.comments.push(comment);
      await book.save();
      res.json({ _id: book._id, title: book.title, comments: book.comments });
    } catch {
      res.status(200).send('no book exists');
    }
  });

  // DELETE /api/books/:id - Remove um livro
  app.delete('/api/books/:id', async (req, res) => {
    try {
      const book = await Book.findByIdAndDelete(req.params.id);
      if (!book) return res.status(200).send('no book exists');
      res.send('delete successful');
    } catch {
      res.status(200).send('no book exists');
    }
  });

  // DELETE /api/books - Remove todos os livros
  app.delete('/api/books', async (req, res) => {
    try {
      await Book.deleteMany({});
      res.send('complete delete successful');
    } catch {
      res.status(500).send('error deleting books');
    }
  });

  // POST /api/solve
  app.post('/api/solve', (req, res) => {
    const { puzzle } = req.body;
    if (!puzzle) return res.json({ error: 'Required field missing' });
    const result = solver.solve(puzzle);
    if (result.error) return res.json(result);
    res.json({ solution: result.solution });
  });

  // POST /api/check
  app.post('/api/check', (req, res) => {
    const { puzzle, coordinate, value } = req.body;
    if (!puzzle || !coordinate || !value) return res.json({ error: 'Required field(s) missing' });
    // Validação básica do puzzle
    const valid = solver.validate(puzzle);
    if (valid !== true) return res.json(valid);
    // Validação do valor
    if (!/^[1-9]$/.test(value)) return res.json({ error: 'Invalid value' });
    // Validação do coordinate
    if (!/^[A-I][1-9]$/.test(coordinate)) return res.json({ error: 'Invalid coordinate' });
    const row = coordinate[0].toUpperCase().charCodeAt(0) - 65;
    const col = parseInt(coordinate[1], 10) - 1;
    if (row < 0 || row > 8 || col < 0 || col > 8) return res.json({ error: 'Invalid coordinate' });
    // Se já está preenchido com o mesmo valor, é válido
    const grid = solver.stringToGrid(puzzle);
    if (grid[row][col] === value) return res.json({ valid: true });
    // Checagem de conflitos
    const conflicts = solver.checkPlacement(puzzle, row, col, value);
    if (conflicts.length === 0) return res.json({ valid: true });
    res.json({ valid: false, conflict: conflicts });
  });

};
