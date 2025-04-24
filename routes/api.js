'use strict';

const expect = require('chai').expect;
const ConvertHandler = require('../controllers/convertHandler.js');
const { randomUUID } = require('crypto');

// In-memory store for issues by project
const issuesDB = {};

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

  // === ISSUE TRACKER ===
  // Helper: get issues array for a project
  function getProjectIssues(project) {
    if (!issuesDB[project]) issuesDB[project] = [];
    return issuesDB[project];
  }

  // POST: Create issue
  app.post('/api/issues/:project', (req, res) => {
    const project = req.params.project;
    const { issue_title, issue_text, created_by, assigned_to = '', status_text = '' } = req.body;
    if (!issue_title || !issue_text || !created_by) {
      return res.json({ error: 'required field(s) missing' });
    }
    const now = new Date();
    const issue = {
      issue_title,
      issue_text,
      created_by,
      assigned_to,
      status_text,
      created_on: now,
      updated_on: now,
      open: true,
      _id: randomUUID(),
    };
    getProjectIssues(project).push(issue);
    res.json(issue);
  });

  // GET: List issues (with optional filters)
  app.get('/api/issues/:project', (req, res) => {
    const project = req.params.project;
    let issues = getProjectIssues(project);
    // Apply filters from query params
    const filters = req.query;
    if (Object.keys(filters).length > 0) {
      issues = issues.filter(issue => {
        return Object.entries(filters).every(([key, value]) => {
          if (key === 'open') return issue.open === (value === 'true');
          return issue[key] == value;
        });
      });
    }
    res.json(issues);
  });

  // PUT: Update issue
  app.put('/api/issues/:project', (req, res) => {
    const project = req.params.project;
    const { _id, ...fields } = req.body;
    if (!_id) return res.json({ error: 'missing _id' });
    if (Object.keys(fields).length === 0 || Object.values(fields).every(v => v === '' || v === undefined)) {
      return res.json({ error: 'no update field(s) sent', _id });
    }
    const issues = getProjectIssues(project);
    const issue = issues.find(i => i._id === _id);
    if (!issue) return res.json({ error: 'could not update', _id });
    let updated = false;
    for (const key of ['issue_title','issue_text','created_by','assigned_to','status_text','open']) {
      if (fields[key] !== undefined && fields[key] !== '') {
        issue[key] = key === 'open' ? fields[key] === 'false' ? false : true : fields[key];
        updated = true;
      }
    }
    if (updated) issue.updated_on = new Date();
    res.json({ result: 'successfully updated', _id });
  });

  // DELETE: Remove issue
  app.delete('/api/issues/:project', (req, res) => {
    const project = req.params.project;
    const { _id } = req.body;
    if (!_id) return res.json({ error: 'missing _id' });
    const issues = getProjectIssues(project);
    const idx = issues.findIndex(i => i._id === _id);
    if (idx === -1) return res.json({ error: 'could not delete', _id });
    issues.splice(idx, 1);
    res.json({ result: 'successfully deleted', _id });
  });

};
