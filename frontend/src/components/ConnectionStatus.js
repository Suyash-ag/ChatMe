import React from 'react';
import './ConnectionStatus.css';

function ConnectionStatus({ connected }) {
  return (
    <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
      <div className="status-dot"></div>
      <span>{connected ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
}

export default ConnectionStatus;

