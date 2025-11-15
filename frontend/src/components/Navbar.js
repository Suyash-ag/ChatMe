import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <span className="navbar-title">ChatMe</span>
      <div className="navbar-links">
        <Link to="/chat" className="navbar-link">Chat</Link>
        <Link to="/login" className="navbar-link">Login</Link>
        <Link to="/register" className="navbar-link">Register</Link>
      </div>
    </nav>
  );
}