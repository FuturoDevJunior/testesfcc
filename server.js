const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração da Unsplash API
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'DEFINA_SUA_CHAVE_AQUI';
const UNSPLASH_URL = 'https://api.unsplash.com/search/photos';

// Persistência simples em memória
let recentSearches = [];
const RECENT_LIMIT = 10;

// Função utilitária para registrar pesquisas
function addRecentSearch(term) {
  const entry = { term, when: new Date().toISOString() };
  recentSearches.unshift(entry);
  if (recentSearches.length > RECENT_LIMIT) recentSearches = recentSearches.slice(0, RECENT_LIMIT);
}

// Endpoint de busca de imagens
app.get('/api/imagesearch/:query', async (req, res) => {
  const { query } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  addRecentSearch(query);

  try {
    const url = `${UNSPLASH_URL}?query=${encodeURIComponent(query)}&page=${page}&per_page=10&client_id=${UNSPLASH_ACCESS_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.results) return res.json([]);
    const results = data.results.map(img => ({
      url: img.urls?.regular,
      snippet: img.alt_description || img.description || '',
      thumbnail: img.urls?.thumb,
      context: img.links?.html
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar imagens.' });
  }
});

// Endpoint de pesquisas recentes
app.get('/api/latest/imagesearch/', (req, res) => {
  res.json(recentSearches);
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
}); 