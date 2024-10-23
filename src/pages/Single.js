import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Single.css';
import Sidebar from '../components/SideBar';
import SongListArea from '../components/SongListArea';
import Preview from '../components/Preview';
import TopBar from '../components/TopBar';

import { SongProvider, useSongs } from '../Context/SongContext';

function Single() {
  const [selectedSong, setSelectedSong] = useState(null);
  const { songLists, fetchSongLists } = useSongs();
  const handleSongSelect = (song) => {
    setSelectedSong(song);
  };

  useEffect(() => {
    fetchSongLists();
  }, []);

  return (
    <div className='single-page'>
      <Sidebar />
      <div className='main-content'>
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
