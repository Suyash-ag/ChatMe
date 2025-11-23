import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import './Login.css';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const authUrl = process.env.REACT_APP_AUTH_API_URL || 'http://localhost:5000/auth';
      await axios.post(`${authUrl}/register`, { username, password });
      setMessage('Registration successful! Redirecting...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Error registering. Please try again.';
      setMessage(errorMessage);
      console.error('Registration error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="card">
        <h2>Create Your Account</h2>
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
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <div className="footer">
          <span>Already have an account?</span>
          <Link to="/login" className="link">Login</Link>
        </div>
        {message && (
          <p className={message.includes('successful') ? 'success' : 'error'}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default Register;
