'use strict';

const expect = require('chai').expect;
const ConvertHandler = require('../controllers/convertHandler.js');
const { randomUUID } = require('crypto');
const mongoose = require('mongoose');

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
    if (!title) return res.send('missing required field title');
    try {
      const book = new Book({ title });
      await book.save();
      res.json({ _id: book._id, title: book.title });
    } catch (err) {
      res.status(500).send('error saving book');
    }
  });

  // GET /api/books - Lista todos os livros
  app.get('/api/books', async (req, res) => {
    const books = await Book.find({}, 'title comments');
    res.json(books.map(b => ({ _id: b._id, title: b.title, commentcount: b.comments.length })));
  });

  // GET /api/books/:id - Detalha um livro
  app.get('/api/books/:id', async (req, res) => {
    try {
      const book = await Book.findById(req.params.id);
      if (!book) return res.send('no book exists');
      res.json({ _id: book._id, title: book.title, comments: book.comments });
    } catch {
      res.send('no book exists');
    }
  });

  // POST /api/books/:id - Adiciona comentário
  app.post('/api/books/:id', async (req, res) => {
    const { comment } = req.body;
    if (!comment) return res.send('missing required field comment');
    try {
      const book = await Book.findById(req.params.id);
      if (!book) return res.send('no book exists');
      book.comments.push(comment);
      await book.save();
      res.json({ _id: book._id, title: book.title, comments: book.comments });
    } catch {
      res.send('no book exists');
    }
  });

  // DELETE /api/books/:id - Remove um livro
  app.delete('/api/books/:id', async (req, res) => {
    try {
      const book = await Book.findByIdAndDelete(req.params.id);
      if (!book) return res.send('no book exists');
      res.send('delete successful');
    } catch {
      res.send('no book exists');
    }
  });

  // DELETE /api/books - Remove todos os livros
  app.delete('/api/books', async (req, res) => {
    await Book.deleteMany({});
    res.send('complete delete successful');
  });

};
