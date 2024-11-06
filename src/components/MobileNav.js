// src/components/MobileNav.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/MobileNav.css';

function MobileNav() {
    const navigate = useNavigate();
    const location = useLocation();

    const currentPath = location.pathname;

    // 현재 경로가 특정 경로와 일치하는지 확인하는 함수
    const isActive = (path) => currentPath === path;
    console.log(currentPath);
    return (
        <div className='mobilenav'>
            <div
                className={`nav-button-mobile ${isActive('/single') ? 'active' : ''}`}
                onClick={() => navigate('/single')}
            >
              <i className="fa-solid fa-user"></i>
            </div>
            <div
                className={`nav-button-mobile ${isActive('/add') ? 'active' : ''}`}
                onClick={() => navigate('/add')}
            >
              <i className="fa-solid fa-circle-plus" style={{fontSize:'2.5rem'}}></i>
            </div>
            <div
                className={`nav-button-mobile ${isActive('/multi') ? 'active' : ''}`}
                onClick={() => navigate('/multi')}
            >
              <i className="fa-solid fa-users"></i>
            </div>
        </div>
    );
}

export default MobileNav;
