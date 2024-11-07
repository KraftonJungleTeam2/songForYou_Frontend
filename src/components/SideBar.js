// src/components/Sidebar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SideBar.css';
import { useScreen } from '../Context/ScreenContext';
import DarkModeToggle from '../components/DarkButton.js';

function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  
  // desktop에서 상단 바 사이드 메뉴 버튼 조정할 때
  // 화면 너비 가져오기
  const { widthScreen } = useScreen();

   // `--sidebar-width` 값을 %에서 숫자로 변환하고 `widthScreen`에 곱해서 픽셀 값으로 계산
  const sidebarWidthPercent = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width')
  );
  const sidebarWidthPx = `${(widthScreen * sidebarWidthPercent) / 100}px`; // 최종 픽셀 값 계산

  document.documentElement.style.setProperty('--sidebar-width-px', `${sidebarWidthPx}`);


  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <nav className='sidebar-nav'>
          {/* <button className='button close-button is-ghost has-text-white' onClick={toggleSidebar}>
            <i className='fa-solid fa-x'></i>
          </button> */}
          <button className='nav-button' onClick={() => navigate('/single')}>
            <i className="fa-solid fa-user"></i>
          </button>
          <button className='nav-button' onClick={() => navigate('/multi')}>
            <i className="fa-solid fa-users"></i>
          </button>
          <button className='nav-button' onClick={() => navigate('/add')}>
            <i className="fa-solid fa-plus"></i>
          </button>
          <DarkModeToggle />
          </nav>
      </div>

      {/* 사이드바 열기/닫기 버튼을 화면에 고정 */}
      {/* <button onClick={toggleSidebar} className={`toggle-button ${isOpen ? 'open' : 'closed'}`}>
        <i className='fa-solid fa-bars'></i>
      </button> */}
    </>
  );
}

export default Sidebar;
