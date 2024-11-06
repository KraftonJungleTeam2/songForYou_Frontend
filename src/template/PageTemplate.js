import React from 'react';
import MobileNav from '../components/MobileNav';
import Sidebar from '../components/SideBar';
import TopBar from '../components/TopBar';

const PageTemplate = ({ isMobile, isSidebarOpen, toggleSidebar, children }) => {
    return (
        <div className='single-page'>
            {isMobile ? (
                <MobileNav />
            ) : (
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
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
