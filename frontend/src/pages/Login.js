import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const authUrl = process.env.REACT_APP_AUTH_API_URL || 'http://localhost:5000/auth';
      const res = await axios.post(`${authUrl}/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', username);
      navigate('/chat');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Error logging in. Please try again.';
      setMessage(errorMessage);
      console.error('Login error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="card">
        <h2>Sign In to ChatMe</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="input"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="input"
            disabled={loading}
          />
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="footer">
          <span>Don't have an account?</span>
          <Link to="/register" className="link">Register</Link>
        </div>
        {message && <p className="error">{message}</p>}
      </div>
    </div>
  );
}

export default Login;