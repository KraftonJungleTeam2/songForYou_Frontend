import React from 'react';
import '../css/TopBar.css';

function TopBar() {
  return (
    <div className="top-bar">
      <div className="right-section">
        <div className="user-avatar">A</div>
        <div className="user-details">
          <h3>User Name</h3>
          <p>Level</p>
        </div>
        <button className="settings-button">⚙️</button>
      </div>
    </div>
  );
}

export default TopBar;