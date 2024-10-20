import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SideBar.css';

function Sidebar() {
  const navigate = useNavigate();

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <button onClick={() => navigate('/single')}>Single</button>
        <button onClick={() => navigate('/multi')}>Multi</button>
      </nav>
    </div>
  );
}

export default Sidebar;