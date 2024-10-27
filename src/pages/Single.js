// src/pages/Single.js
import React, { useState, useEffect } from 'react';
import '../css/Single.css';
import Sidebar from '../components/SideBar';
import SongListArea from '../components/SongListArea';
import Preview from '../components/Preview';
import TopBar from '../components/TopBar';
import { SongProvider, useSongs } from '../Context/SongContext';

function Single() {
  const [selectedSong, setSelectedSong] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { songLists, fetchSongLists } = useSongs();

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
      <button onClick={toggleSidebar} className="toggle-button">
        {isSidebarOpen ? 'Close' : 'Open'}
      </button>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`main-content ${isSidebarOpen ? 'shifted' : ''}`}>
        <TopBar />
        <div className='content-area'>
          <div className='preview-area'>
            <Preview selectedSong={selectedSong} />
          </div>
          <SongListArea onSongSelect={handleSongSelect} publicSongs={songLists.public} privateSongs={songLists.private} />
        </div>
      </div>
    </div>
  );
}

export default Single;
