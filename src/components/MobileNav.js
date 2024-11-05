// src/components/Sidebar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/MobileNav.css';


function MobileNav() {
    const navigate = useNavigate();


  return (
    
    <div className='mobilenav'>
    
        <div className='nav-button' onClick={() => navigate('/single')}>
        single
        </div>
        <div className='nav-button' onClick={() => navigate('/multi')}>
        Multi
        </div>
        <div className='nav-button' onClick={() => navigate('/add')}>
        Add
        </div>
    
    </div>
   
  );
}

export default MobileNav;
