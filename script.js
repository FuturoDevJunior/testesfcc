// URLs dos dados
const WORLD_URL = 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json';
const METEORITE_URL = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json';

const mapContainer = document.getElementById('map');
const width = mapContainer.offsetWidth;
const height = mapContainer.offsetHeight;

// Cria SVG
const svg = d3.select('#map')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

const tooltip = d3.select('#tooltip');

// Projeção e path
const projection = d3.geoNaturalEarth1()
  .scale(width / 6.5)
  .translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

Promise.all([
  d3.json(WORLD_URL),
  d3.json(METEORITE_URL)
]).then(([world, meteorites]) => {
  drawMap(world);
  drawMeteorites(meteorites.features);
});

function drawMap(world) {
  const countries = topojson.feature(world, world.objects.countries).features;
  svg.append('g')
    .selectAll('path')
    .data(countries)
    .enter().append('path')
    .attr('class', 'land')
    .attr('d', path);
}

function drawMeteorites(data) {
  // Filtra meteoritos com coordenadas válidas
  const meteorites = data.filter(d => d.geometry && d.geometry.coordinates);

  // Escala de tamanho (raio do círculo)
  const massExtent = d3.extent(meteorites, d => +d.properties.mass || 1);
  const radius = d3.scaleSqrt()
    .domain(massExtent)
    .range([2, 30]);

  svg.append('g')
    .selectAll('circle')
    .data(meteorites)
    .enter().append('circle')
    .attr('class', 'meteorite')
    .attr('cx', d => projection(d.geometry.coordinates)[0])
    .attr('cy', d => projection(d.geometry.coordinates)[1])
    .attr('r', d => radius(+d.properties.mass || 1))
    .on('mouseover', function(event, d) {
      d3.select(this).attr('stroke', '#222').attr('opacity', 1);
      tooltip.transition().duration(120).style('opacity', 1);
      tooltip.html(getTooltipContent(d))
        .style('left', (event.pageX + 18) + 'px')
        .style('top', (event.pageY - 24) + 'px');
    })
    .on('mousemove', function(event) {
      tooltip.style('left', (event.pageX + 18) + 'px')
             .style('top', (event.pageY - 24) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this).attr('stroke', '#fff').attr('opacity', 0.85);
      tooltip.transition().duration(180).style('opacity', 0);
    });
}

function getTooltipContent(d) {
  const p = d.properties;
  return `
    <strong>${p.name || 'Unknown'}</strong><br>
    <span><b>Mass:</b> ${p.mass ? (+p.mass).toLocaleString() + ' g' : 'N/A'}</span><br>
    <span><b>Year:</b> ${p.year ? new Date(p.year).getFullYear() : 'N/A'}</span><br>
    <span><b>Class:</b> ${p.recclass || 'N/A'}</span><br>
    <span><b>Fall:</b> ${p.fall || 'N/A'}</span><br>
    <span><b>Location:</b> [${d.geometry.coordinates[1].toFixed(2)}, ${d.geometry.coordinates[0].toFixed(2)}]</span>
  `;
}

// --- Modelos de Dados ---

class User {
  constructor(username, fullName = '', city = '', state = '') {
    this.username = username;
    this.fullName = fullName;
    this.city = city;
    this.state = state;
  }
}

class Book {
  constructor(id, title, author, owner) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.owner = owner; // username
  }
}

class Trade {
  constructor(id, bookId, fromUser, toUser, status = 'pending') {
    this.id = id;
    this.bookId = bookId;
    this.fromUser = fromUser;
    this.toUser = toUser;
    this.status = status; // pending, accepted, rejected
  }
}

// --- Persistência (localStorage) ---

const Storage = {
  getUsers() {
    return JSON.parse(localStorage.getItem('btc_users') || '[]');
  },
  saveUsers(users) {
    localStorage.setItem('btc_users', JSON.stringify(users));
  },
  getBooks() {
    return JSON.parse(localStorage.getItem('btc_books') || '[]');
  },
  saveBooks(books) {
    localStorage.setItem('btc_books', JSON.stringify(books));
  },
  getTrades() {
    return JSON.parse(localStorage.getItem('btc_trades') || '[]');
  },
  saveTrades(trades) {
    localStorage.setItem('btc_trades', JSON.stringify(trades));
  },
  getCurrentUser() {
    return localStorage.getItem('btc_current_user');
  },
  setCurrentUser(username) {
    localStorage.setItem('btc_current_user', username);
  }
};

// --- Utilitários ---

function generateId(prefix) {
  return prefix + '_' + Math.random().toString(36).substr(2, 9);
}

// --- Estado Inicial (Mock de Usuário Logado) ---

function ensureInitialUser() {
  let users = Storage.getUsers();
  let currentUser = Storage.getCurrentUser();
  if (!currentUser) {
    // Cria um usuário padrão
    const username = 'meu_usuario';
    users.push(new User(username, 'Seu Nome', 'Sua Cidade', 'Seu Estado'));
    Storage.saveUsers(users);
    Storage.setCurrentUser(username);
  }
}
ensureInitialUser();

// --- Renderização e Navegação ---

const sections = {
  books: document.getElementById('books-section'),
  addBook: document.getElementById('add-book-section'),
  profile: document.getElementById('profile-section'),
  trades: document.getElementById('trades-section')
};

function showSection(section) {
  Object.values(sections).forEach(sec => sec.classList.remove('active'));
  sections[section].classList.add('active');
}

document.getElementById('view-books-btn').onclick = () => {
  renderBooks();
  showSection('books');
};
document.getElementById('add-book-btn').onclick = () => {
  renderAddBookForm();
  showSection('addBook');
};
document.getElementById('profile-btn').onclick = () => {
  renderProfileForm();
  showSection('profile');
};
document.getElementById('trades-btn').onclick = () => {
  renderTrades();
  showSection('trades');
};

// --- Renderização dos Livros ---

function renderBooks() {
  const books = Storage.getBooks();
  const users = Storage.getUsers();
  const currentUser = Storage.getCurrentUser();
  let html = `<h2>Todos os Livros</h2><div class="book-list">`;
  if (books.length === 0) {
    html += `<p>Nenhum livro cadastrado ainda.</p>`;
  } else {
    for (const book of books) {
      const owner = users.find(u => u.username === book.owner);
      html += `
        <div class="book-card">
          <h3>${book.title}</h3>
          <div>Autor: <b>${book.author}</b></div>
          <div class="owner">Dono: ${owner ? owner.fullName : book.owner}</div>
          ${book.owner !== currentUser ? `<button onclick="proposeTrade('${book.id}')">Propor Troca</button>` : ''}
        </div>
      `;
    }
  }
  html += `</div>`;
  sections.books.innerHTML = html;
}

// --- Adicionar Livro ---

function renderAddBookForm() {
  sections.addBook.innerHTML = `
    <h2>Adicionar Novo Livro</h2>
    <form id="add-book-form">
      <label>Título do Livro
        <input type="text" name="title" required>
      </label>
      <label>Autor
        <input type="text" name="author" required>
      </label>
      <button type="submit">Adicionar</button>
    </form>
  `;
  document.getElementById('add-book-form').onsubmit = function(e) {
    e.preventDefault();
    const form = e.target;
    const title = form.title.value.trim();
    const author = form.author.value.trim();
    if (!title || !author) return;
    const books = Storage.getBooks();
    const currentUser = Storage.getCurrentUser();
    books.push(new Book(generateId('book'), title, author, currentUser));
    Storage.saveBooks(books);
    renderBooks();
    showSection('books');
  };
}

// --- Perfil do Usuário ---

function renderProfileForm() {
  const users = Storage.getUsers();
  const currentUser = Storage.getCurrentUser();
  const user = users.find(u => u.username === currentUser);
  sections.profile.innerHTML = `
    <h2>Meu Perfil</h2>
    <form id="profile-form">
      <label>Nome Completo
        <input type="text" name="fullName" value="${user.fullName}" required>
      </label>
      <label>Cidade
        <input type="text" name="city" value="${user.city}" required>
      </label>
      <label>Estado
        <input type="text" name="state" value="${user.state}" required>
      </label>
      <button type="submit">Salvar</button>
    </form>
  `;
  document.getElementById('profile-form').onsubmit = function(e) {
    e.preventDefault();
    user.fullName = e.target.fullName.value.trim();
    user.city = e.target.city.value.trim();
    user.state = e.target.state.value.trim();
    Storage.saveUsers(users);
    alert('Perfil atualizado!');
    renderProfileForm();
  };
}

// --- Trocas ---

function renderTrades() {
  const trades = Storage.getTrades();
  const books = Storage.getBooks();
  const users = Storage.getUsers();
  const currentUser = Storage.getCurrentUser();
  let html = `<h2>Minhas Trocas</h2><div class="trade-list">`;
  const myTrades = trades.filter(t => t.fromUser === currentUser || t.toUser === currentUser);
  if (myTrades.length === 0) {
    html += `<p>Você não possui trocas ainda.</p>`;
  } else {
    for (const trade of myTrades) {
      const book = books.find(b => b.id === trade.bookId);
      const from = users.find(u => u.username === trade.fromUser);
      const to = users.find(u => u.username === trade.toUser);
      html += `
        <div class="trade-card">
          <div><b>Livro:</b> ${book ? book.title : 'Removido'}</div>
          <div><b>De:</b> ${from ? from.fullName : trade.fromUser}</div>
          <div><b>Para:</b> ${to ? to.fullName : trade.toUser}</div>
          <div class="status ${trade.status}">Status: ${trade.status}</div>
          ${trade.status === 'pending' && trade.toUser === currentUser ? `
            <button onclick="acceptTrade('${trade.id}')">Aceitar</button>
            <button onclick="rejectTrade('${trade.id}')">Rejeitar</button>
          ` : ''}
        </div>
      `;
    }
  }
  html += `</div>`;
  sections.trades.innerHTML = html;
}

// --- Propor Troca ---

window.proposeTrade = function(bookId) {
  const books = Storage.getBooks();
  const book = books.find(b => b.id === bookId);
  if (!book) return;
  const trades = Storage.getTrades();
  const currentUser = Storage.getCurrentUser();
  if (book.owner === currentUser) {
    alert('Você não pode propor troca para seu próprio livro.');
    return;
  }
  // Verifica se já existe troca pendente para este livro e usuário
  if (trades.some(t => t.bookId === bookId && t.fromUser === currentUser && t.status === 'pending')) {
    alert('Você já propôs uma troca para este livro.');
    return;
  }
  trades.push(new Trade(generateId('trade'), bookId, currentUser, book.owner));
  Storage.saveTrades(trades);
  alert('Troca proposta! Aguarde a resposta do dono do livro.');
  renderTrades();
  showSection('trades');
};

// --- Aceitar/Rejeitar Troca ---

window.acceptTrade = function(tradeId) {
  const trades = Storage.getTrades();
  const trade = trades.find(t => t.id === tradeId);
  if (!trade || trade.status !== 'pending') return;
  trade.status = 'accepted';
  Storage.saveTrades(trades);
  alert('Troca aceita!');
  renderTrades();
};

window.rejectTrade = function(tradeId) {
  const trades = Storage.getTrades();
  const trade = trades.find(t => t.id === tradeId);
  if (!trade || trade.status !== 'pending') return;
  trade.status = 'rejected';
  Storage.saveTrades(trades);
  alert('Troca rejeitada.');
  renderTrades();
};

// --- Inicialização ---

// Exibe livros ao carregar
renderBooks();
showSection('books'); 