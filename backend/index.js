import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Dados em memória
let polls = [];
let users = [{ id: '1', username: 'user', password: 'pass' }];
let sessions = {};

// Middleware de autenticação fake
function auth(req, res, next) {
  const token = req.headers['authorization'];
  if (token && sessions[token]) {
    req.user = sessions[token];
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

// Login fake
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const token = Math.random().toString(36).substring(2);
    sessions[token] = user;
    res.json({ token, user: { id: user.id, username: user.username } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Logout fake
app.post('/api/logout', auth, (req, res) => {
  const token = req.headers['authorization'];
  delete sessions[token];
  res.json({ ok: true });
});

// Listar todas as enquetes
app.get('/api/polls', (req, res) => {
  res.json(polls);
});

// Criar nova enquete
app.post('/api/polls', auth, (req, res) => {
  const { question, options } = req.body;
  const poll = {
    id: Math.random().toString(36).substring(2),
    question,
    options: options.map(opt => ({ text: opt, votes: 0 })),
    owner: req.user.id,
    voters: [],
  };
  polls.push(poll);
  res.json(poll);
});

// Votar em uma enquete
app.post('/api/polls/:id/vote', (req, res) => {
  const { id } = req.params;
  const { option } = req.body;
  const poll = polls.find(p => p.id === id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  if (poll.voters.includes(req.ip)) return res.status(400).json({ error: 'Already voted' });
  const opt = poll.options[option];
  if (!opt) return res.status(400).json({ error: 'Invalid option' });
  opt.votes++;
  poll.voters.push(req.ip);
  res.json(poll);
});

// Adicionar nova opção
app.post('/api/polls/:id/option', auth, (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const poll = polls.find(p => p.id === id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  poll.options.push({ text, votes: 0 });
  res.json(poll);
});

// Deletar enquete
app.delete('/api/polls/:id', auth, (req, res) => {
  const { id } = req.params;
  const poll = polls.find(p => p.id === id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  if (poll.owner !== req.user.id) return res.status(403).json({ error: 'Not owner' });
  polls = polls.filter(p => p.id !== id);
  res.json({ ok: true });
});

// Resultados agregados
app.get('/api/polls/:id', (req, res) => {
  const { id } = req.params;
  const poll = polls.find(p => p.id === id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  res.json(poll);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Backend running on port', PORT)); 