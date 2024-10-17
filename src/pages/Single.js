import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import '../css/Single.css';
import Sidebar from '../components/SideBar';
import SongListArea from '../components/SongListArea';
import Preview from '../components/Preview';
import TopBar from '../components/TopBar';

function Single() {
  const [selectedSong, setSelectedSong] = useState(null);

  const handleSongSelect = (song) => {
    setSelectedSong(song);
  };

  return (
    <div className="single-page">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <div className="content-area">
          <SongListArea onSongSelect={handleSongSelect} />
          <div className="preview-area">
            <Preview selectedSong={selectedSong} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Single;