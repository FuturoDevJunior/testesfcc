const chaiHttp = require('chai-http');
const chai = require('chai');
let assert = chai.assert;
const server = require('../server');
const SudokuSolver = require('../controllers/sudoku-solver.js');
const puzzles = require('../controllers/puzzle-strings.js');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  test('Convert a valid input such as 10L: GET request to /api/convert', function(done) {
    chai.request(server)
      .get('/api/convert')
      .query({ input: '10L' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.initNum, 10);
        assert.equal(res.body.initUnit, 'L');
        assert.approximately(res.body.returnNum, 2.64172, 0.00001);
        assert.equal(res.body.returnUnit, 'gal');
        assert.match(res.body.string, /10 liters converts to 2.64172 gallons/);
        done();
      });
  });
  test('Convert an invalid input such as 32g: GET request to /api/convert', function(done) {
    chai.request(server)
      .get('/api/convert')
      .query({ input: '32g' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'invalid unit' });
        done();
      });
  });
  test('Convert an invalid number such as 3/7.2/4kg: GET request to /api/convert', function(done) {
    chai.request(server)
      .get('/api/convert')
      .query({ input: '3/7.2/4kg' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'invalid number' });
        done();
      });
  });
  test('Convert an invalid number AND unit such as 3/7.2/4kilomegagram: GET request to /api/convert', function(done) {
    chai.request(server)
      .get('/api/convert')
      .query({ input: '3/7.2/4kilomegagram' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'invalid number and unit' });
        done();
      });
  });
  test('Convert with no number such as kg: GET request to /api/convert', function(done) {
    chai.request(server)
      .get('/api/convert')
      .query({ input: 'kg' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.initNum, 1);
        assert.equal(res.body.initUnit, 'kg');
        assert.approximately(res.body.returnNum, 2.20462, 0.00001);
        assert.equal(res.body.returnUnit, 'lbs');
        assert.match(res.body.string, /1 kilograms converts to 2.20462 pounds/);
        done();
      });
  });
});

describe('Sudoku Solver Functional Tests', function() {
  it('Solve a puzzle with valid puzzle string: POST request to /api/solve', function(done) {
    chai.request(server)
      .post('/api/solve')
      .send({ puzzle: puzzles[0] })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'solution');
        done();
      });
  });
  it('Solve a puzzle with missing puzzle string: POST request to /api/solve', function(done) {
    chai.request(server)
      .post('/api/solve')
      .send({})
      .end((err, res) => {
        assert.deepEqual(res.body, { error: 'Required field missing' });
        done();
      });
  });
  it('Solve a puzzle with invalid characters: POST request to /api/solve', function(done) {
    chai.request(server)
      .post('/api/solve')
      .send({ puzzle: puzzles[1] })
      .end((err, res) => {
        assert.deepEqual(res.body, { error: 'Invalid characters in puzzle' });
        done();
      });
  });
  it('Solve a puzzle with incorrect length: POST request to /api/solve', function(done) {
    chai.request(server)
      .post('/api/solve')
      .send({ puzzle: puzzles[2] })
      .end((err, res) => {
        assert.deepEqual(res.body, { error: 'Expected puzzle to be 81 characters long' });
        done();
      });
  });
  it('Solve a puzzle that cannot be solved: POST request to /api/solve', function(done) {
    chai.request(server)
      .post('/api/solve')
      .send({ puzzle: puzzles[3] })
      .end((err, res) => {
        assert.deepEqual(res.body, { error: 'Puzzle cannot be solved' });
        done();
      });
  });
  // Testes para /api/check podem ser adicionados aqui seguindo o mesmo padrão
});
