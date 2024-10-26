// src/components/SideBar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SideBar.css';

function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <nav className='sidebar-nav'>
        <button onClick={() => navigate('/single')}>Single</button>
        <button onClick={() => navigate('/multi')}>Multi</button>
        <button onClick={() => navigate('/add')}>Add</button>
      </nav>
    </div>
  );
}

export default Sidebar;
