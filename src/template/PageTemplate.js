import React from 'react';
import MobileNav from '../components/MobileNav';
import Sidebar from '../components/SideBar';
import TopBar from '../components/TopBar';
import '../css/Base.css';

const PageTemplate = ({ isMobile, isSidebarOpen, toggleSidebar, children, current }) => {
    return (
        <div className='base-page'>
            {isMobile ? (
                <MobileNav />
            ) : (
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} current={current} />
            )}
            <div className={`main-content ${isSidebarOpen ? 'shifted' : ''}`}>
                <TopBar />
                <div className='content-area'>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default PageTemplate;
