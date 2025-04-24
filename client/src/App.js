import './App.css';

import React, {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';
import Masonry from 'react-masonry-css';
import {
  BrowserRouter as Router,
  Link,
  Route,
  Routes,
} from 'react-router-dom';

const API_URL = 'http://localhost:5000';

function useAuth() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    axios.get(`${API_URL}/auth/user`, { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);
  return user;
}

function Login() {
  return (
    <div className="login-container">
      <h2>Login com GitHub</h2>
      <a className="login-btn" href={`${API_URL}/auth/github`}>Entrar com GitHub</a>
    </div>
  );
}

function Wall({ user }) {
  const [images, setImages] = useState([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const placeholder = 'https://via.placeholder.com/300x200?text=Imagem+Indispon%C3%ADvel';

  const breakpointColumnsObj = { default: 3, 800: 2, 500: 1 };

  useEffect(() => {
    const params = user ? { userId: user._id } : {};
    axios.get(`${API_URL}/api/images`, { params, withCredentials: true })
      .then(res => setImages(res.data))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, [user, refresh]);

  const addImage = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`${API_URL}/api/images`, { url }, { withCredentials: true });
      setUrl('');
      setRefresh(r => r + 1);
    } catch (err) {
      setError('Erro ao adicionar imagem.');
    }
  };

  const deleteImage = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/images/${id}`, { withCredentials: true });
      setRefresh(r => r + 1);
    } catch (err) {
      setError('Erro ao deletar imagem.');
    }
  };

  if (loading) return <div>Carregando mural...</div>;

  return (
    <div className="wall-container">
      {user && (
        <form onSubmit={addImage} className="add-image-form">
          <input
            type="url"
            placeholder="URL da imagem"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
          />
          <button type="submit">Adicionar</button>
        </form>
      )}
      {error && <div className="error">{error}</div>}
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {images.map(img => (
          <div className="image-card" key={img._id}>
            <img
              src={img.url}
              alt="user-img"
              onError={e => { e.target.onerror = null; e.target.src = placeholder; }}
            />
            <div className="image-meta">
              <span>@{img.username}</span>
              {user && img.userId === user._id && (
                <button onClick={() => deleteImage(img._id)}>Deletar</button>
              )}
            </div>
          </div>
        ))}
      </Masonry>
    </div>
  );
}

function Navbar({ user }) {
  return (
    <nav className="navbar">
      <Link to="/">Pinterest Clone</Link>
      <div>
        {user ? (
          <>
            <span>Olá, {user.displayName || user.username}</span>
            <a className="logout-btn" href={`${API_URL}/auth/logout`}>Logout</a>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  const user = useAuth();
  return (
    <Router>
      <Navbar user={user} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/user/:userId" element={<Wall user={null} />} />
        <Route path="/" element={<Wall user={user} />} />
      </Routes>
    </Router>
  );
}

export default App;
