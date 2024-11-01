// src/components/Sidebar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SideBar.css';

function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();

  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <nav className='sidebar-nav'>
          <button className='button close-button is-ghost has-text-white' onClick={toggleSidebar}>
            <i className='fa-solid fa-x'></i>
          </button>
          <button className='nav-button' onClick={() => navigate('/single')}>
            Single
          </button>
          <button className='nav-button' onClick={() => navigate('/multi')}>
            Multi
          </button>
          <button className='nav-button' onClick={() => navigate('/add')}>
            Add
          </button>{' '}
        </nav>
      </div>

      {/* 사이드바 열기/닫기 버튼을 화면에 고정 */}
      <button onClick={toggleSidebar} className={`toggle-button ${isOpen ? 'open' : 'closed'}`}>
        <i className='fa-solid fa-bars'></i>
      </button>
    </>
  );
}

export default Sidebar;
