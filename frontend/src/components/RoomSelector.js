import React, { useState } from 'react';
import './RoomSelector.css';

function RoomSelector({ currentRoom, onRoomChange }) {
  const [roomInput, setRoomInput] = useState(currentRoom);
  const [isEditing, setIsEditing] = useState(false);

  const popularRooms = ['general', 'tech', 'gaming', 'random', 'help'];

  const handleRoomSubmit = (e) => {
    e.preventDefault();
    const newRoom = roomInput.trim() || 'general';
    onRoomChange(newRoom);
    setIsEditing(false);
  };

  const handleQuickRoomSelect = (room) => {
    setRoomInput(room);
    onRoomChange(room);
    setIsEditing(false);
  };

  return (
    <div className="room-selector">
      <form onSubmit={handleRoomSubmit} className="room-selector-form">
        <div className="room-input-wrapper">
          <span className="room-prefix">#</span>
          <input
            type="text"
            className="room-input"
            placeholder="Enter room name..."
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setTimeout(() => setIsEditing(false), 200)}
          />
        </div>
      </form>
      
      {isEditing && (
        <div className="popular-rooms">
          <div className="popular-rooms-label">Popular rooms:</div>
          <div className="popular-rooms-list">
            {popularRooms.map((room) => (
              <button
                key={room}
                type="button"
                className={`popular-room-tag ${roomInput === room ? 'active' : ''}`}
                onClick={() => handleQuickRoomSelect(room)}
              >
                #{room}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomSelector;

