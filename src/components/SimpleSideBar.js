// src/components/Sidebar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function SimpleSidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();

  return (
    <div className="simplesidebar-container">
      {/* 토글 버튼과 사이드바 메뉴가 같은 위치에서 확장되도록 설정 */}
      <button onClick={toggleSidebar} className={`simplesidebar-toggle-button ${isOpen ? 'open' : 'closed'}`}>
        <i className={`fa-solid ${isOpen ? 'fa-x' : 'fa-bars'}`}></i>
      </button>

      {/* 버튼 위치에서 확장되는 네비게이션 바 */}
      {isOpen && (
        <div className="simplesidebar">
          <nav className='simplesidebar-nav'>
            <button className='simplesidebar-button' onClick={() => navigate('/single')}>
              Single
            </button>
            <button className='simplesidebar-button' onClick={() => navigate('/multi')}>
              Multi
            </button>
            <button className='simplesidebar-button' onClick={() => navigate('/add')}>
              Add
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

export default SimpleSidebar;
