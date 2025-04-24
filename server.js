// server.js
// Backend de sinalização para Video Chat P2P (freeCodeCamp)
// Node.js + ws

const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3001 });

// Estrutura de salas: { [roomName]: Set<ws> }
const rooms = {};

function send(ws, type, payload) {
  ws.send(JSON.stringify({ type, ...payload }));
}

server.on('connection', (ws) => {
  ws.room = null;
  ws.isAlive = true;

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      send(ws, 'error', { message: 'Mensagem inválida.' });
      return;
    }
    const { type, room } = data;
    if (type === 'join') {
      if (!room || typeof room !== 'string' || !room.trim()) {
        send(ws, 'error', { message: 'Nome de sala inválido.' });
        return;
      }
      if (!rooms[room]) rooms[room] = new Set();
      if (rooms[room].size >= 2) {
        send(ws, 'full', { message: 'Sala cheia.' });
        return;
      }
      rooms[room].add(ws);
      ws.room = room;
      send(ws, 'joined', { users: rooms[room].size });
      // Notifica o outro usuário, se houver
      rooms[room].forEach(client => {
        if (client !== ws) send(client, 'peer-joined', {});
      });
    } else if (type === 'signal') {
      // Encaminha sinalização para o outro peer
      if (!ws.room || !rooms[ws.room]) return;
      rooms[ws.room].forEach(client => {
        if (client !== ws) send(client, 'signal', { data: data.data });
      });
    } else if (type === 'leave') {
      if (ws.room && rooms[ws.room]) {
        rooms[ws.room].delete(ws);
        if (rooms[ws.room].size === 0) delete rooms[ws.room];
        else rooms[ws.room].forEach(client => send(client, 'peer-left', {}));
        ws.room = null;
      }
    }
  });

  ws.on('close', () => {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room].delete(ws);
      if (rooms[ws.room].size === 0) delete rooms[ws.room];
      else rooms[ws.room].forEach(client => send(client, 'peer-left', {}));
    }
  });
});

// Heartbeat para detectar conexões mortas
typeof setInterval !== 'undefined' && setInterval(() => {
  server.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

console.log('WebSocket signaling server running on ws://localhost:3001'); 