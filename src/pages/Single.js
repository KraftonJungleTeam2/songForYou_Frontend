// src/pages/Single.js
import React, { useState, useEffect } from 'react';
import '../css/Single.css';
import Sidebar from '../components/SideBar';
import SongListArea from '../components/SongListArea';
import Preview from '../components/Preview';
import TopBar from '../components/TopBar';
import { useSongs } from '../Context/SongContext';
import { useScreen } from '../Context/ScreenContext';

function Single() {
  const [selectedSong, setSelectedSong] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { songLists, fetchSongLists } = useSongs();
  const { isMobile } = useScreen();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSongSelect = (song) => {
    setSelectedSong(song);
  };
  
  useEffect(() => {
    fetchSongLists();
  }, []);

  return (
    <div className='single-page'>
      {!isMobile && <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} /> }
      <div className={`main-content ${isSidebarOpen ? 'shifted' : ''}`}>
        <TopBar />
        <div className='content-area'>
          <SongListArea onSongSelect={handleSongSelect} publicSongs={songLists.public} privateSongs={songLists.private} />
          <div className='preview-area'>
            <Preview selectedSong={selectedSong} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Single;
