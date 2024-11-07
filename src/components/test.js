<div className='single-page'>
      {isMobile ? (
        <MobileNav />
      ) : (
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      )}
      <div className={`main-content ${isSidebarOpen ? 'shifted' : ''}`}>
        <TopBar />
        <div className='content-area'>
        
      </div>
    </div>
  </div>