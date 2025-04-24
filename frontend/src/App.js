import React, {
  useEffect,
  useState,
} from 'react';

import Chart from 'chart.js/auto';

const API = 'http://localhost:5000/api';

function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  // Polls state
  const [polls, setPolls] = useState([]);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [voteIdx, setVoteIdx] = useState(null);
  const [newOption, setNewOption] = useState('');
  const [error, setError] = useState('');

  // Fetch polls
  useEffect(() => {
    fetch(`${API}/polls`).then(r => r.json()).then(setPolls);
  }, [selectedPoll]);

  // Chart rendering
  useEffect(() => {
    if (selectedPoll && selectedPoll.options) {
      const ctx = document.getElementById('resultsChart');
      if (ctx) {
        if (window.chartInstance) window.chartInstance.destroy();
        window.chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: selectedPoll.options.map(o => o.text),
            datasets: [{
              label: 'Votes',
              data: selectedPoll.options.map(o => o.votes),
              backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }]
          },
          options: { responsive: true, plugins: { legend: { display: false } } }
        });
      }
    }
  }, [selectedPoll]);

  // Auth handlers
  function handleLogin(e) {
    e.preventDefault();
    fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    })
      .then(r => r.json())
      .then(data => {
        if (data.token) {
          setUser(data.user);
          setToken(data.token);
          setError('');
        } else {
          setError('Login inválido');
        }
      });
  }
  function handleLogout() {
    fetch(`${API}/logout`, {
      method: 'POST',
      headers: { 'Authorization': token }
    }).then(() => {
      setUser(null);
      setToken('');
      setSelectedPoll(null);
    });
  }

  // Poll handlers
  function handleCreatePoll(e) {
    e.preventDefault();
    fetch(`${API}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify({ question, options: options.filter(o => o) })
    })
      .then(r => r.json())
      .then(poll => {
        setPolls([...polls, poll]);
        setQuestion('');
        setOptions(['', '']);
      });
  }
  function handleVote(pollId) {
    fetch(`${API}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option: voteIdx })
    })
      .then(r => r.json())
      .then(poll => setSelectedPoll(poll));
  }
  function handleAddOption(pollId) {
    fetch(`${API}/polls/${pollId}/option`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify({ text: newOption })
    })
      .then(r => r.json())
      .then(poll => {
        setSelectedPoll(poll);
        setNewOption('');
      });
  }
  function handleDeletePoll(pollId) {
    fetch(`${API}/polls/${pollId}`, {
      method: 'DELETE',
      headers: { 'Authorization': token }
    })
      .then(() => {
        setPolls(polls.filter(p => p.id !== pollId));
        setSelectedPoll(null);
      });
  }
  function handleShowResults(pollId) {
    fetch(`${API}/polls/${pollId}`)
      .then(r => r.json())
      .then(setSelectedPoll);
  }

  // UI
  if (!user) {
    return (
      <div style={{ maxWidth: 400, margin: '2rem auto' }}>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input placeholder="Usuário" value={loginData.username} onChange={e => setLoginData({ ...loginData, username: e.target.value })} />
          <input placeholder="Senha" type="password" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
          <button type="submit">Entrar</button>
        </form>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <hr />
        <PollList polls={polls} onShowResults={handleShowResults} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h2>Bem-vindo, {user.username} <button onClick={handleLogout}>Sair</button></h2>
      <h3>Minhas Enquetes</h3>
      <PollList polls={polls.filter(p => p.owner === user.id)} onShowResults={handleShowResults} onDelete={handleDeletePoll} />
      <h3>Criar Nova Enquete</h3>
      <form onSubmit={handleCreatePoll}>
        <input placeholder="Pergunta" value={question} onChange={e => setQuestion(e.target.value)} required />
        {options.map((opt, i) => (
          <input key={i} placeholder={`Opção ${i + 1}`} value={opt} onChange={e => setOptions(options.map((o, j) => i === j ? e.target.value : o))} required={i < 2} />
        ))}
        <button type="button" onClick={() => setOptions([...options, ''])}>Adicionar Opção</button>
        <button type="submit">Criar</button>
      </form>
      <hr />
      <h3>Todas as Enquetes</h3>
      <PollList polls={polls} onShowResults={handleShowResults} />
      {selectedPoll && (
        <div style={{ border: '1px solid #ccc', padding: 16, marginTop: 16 }}>
          <h4>{selectedPoll.question}</h4>
          <ul>
            {selectedPoll.options.map((opt, i) => (
              <li key={i}>{opt.text} ({opt.votes} votos)</li>
            ))}
          </ul>
          <div>
            <h5>Votar</h5>
            <select onChange={e => setVoteIdx(Number(e.target.value))} defaultValue="">
              <option value="" disabled>Escolha uma opção</option>
              {selectedPoll.options.map((opt, i) => (
                <option key={i} value={i}>{opt.text}</option>
              ))}
            </select>
            <button onClick={() => handleVote(selectedPoll.id)} disabled={voteIdx === null}>Votar</button>
          </div>
          {user && (
            <div>
              <h5>Adicionar Opção</h5>
              <input value={newOption} onChange={e => setNewOption(e.target.value)} placeholder="Nova opção" />
              <button onClick={() => handleAddOption(selectedPoll.id)} disabled={!newOption}>Adicionar</button>
            </div>
          )}
          <div>
            <h5>Resultados</h5>
            <canvas id="resultsChart" width="400" height="200"></canvas>
          </div>
          {user && selectedPoll.owner === user.id && (
            <button onClick={() => handleDeletePoll(selectedPoll.id)} style={{ color: 'red' }}>Deletar Enquete</button>
          )}
          <button onClick={() => setSelectedPoll(null)}>Fechar</button>
        </div>
      )}
    </div>
  );
}

function PollList({ polls, onShowResults, onDelete }) {
  if (!polls.length) return <div>Nenhuma enquete.</div>;
  return (
    <ul>
      {polls.map(p => (
        <li key={p.id}>
          {p.question}
          <button onClick={() => onShowResults && onShowResults(p.id)}>Ver</button>
          {onDelete && <button onClick={() => onDelete(p.id)} style={{ color: 'red' }}>Deletar</button>}
        </li>
      ))}
    </ul>
  );
}

export default App; 