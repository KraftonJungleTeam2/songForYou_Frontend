import React, { useState, useEffect } from 'react';
import '../css/Single.css';
import Sidebar from '../components/SideBar';
import SongListArea from '../components/SongListArea';
import Preview from '../components/Preview';
import TopBar from '../components/TopBar';

function Single() {
  const [selectedSong, setSelectedSong] = useState(null);
  const [songLists, setSongLists] = useState({ public: [], private: [] });

  useEffect(() => {
    fetchSongLists();
  }, []);

  const fetchSongLists = async () => {
    try {
      const token = sessionStorage.getItem('jwt');
      if (!token) {
        console.error('No JWT token found');
        return;
      }

      const response = await fetch('http://api/song-lists', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch song lists');
      }

      const data = await response.json();
      setSongLists(data);
    } catch (error) {
      console.error('Error fetching song lists:', error);
    }
  };

  const handleSongSelect = (song) => {
    setSelectedSong(song);
  };

  return (
    <div className="single-page">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <div className="content-area">
          <SongListArea 
            onSongSelect={handleSongSelect} 
            publicSongs={songLists.public}
            privateSongs={songLists.private}
          />
          <div className="preview-area">
            <Preview selectedSong={selectedSong} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Single;