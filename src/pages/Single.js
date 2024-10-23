import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Single.css';
import Sidebar from '../components/SideBar';
import SongListArea from '../components/SongListArea';
import Preview from '../components/Preview';
import TopBar from '../components/TopBar';

function Single() {
  const [selectedSong, setSelectedSong] = useState(null);
  const [songLists, setSongLists] = useState({ public: [], private: [] });

  useEffect(() => {}, []);

  const fetchSongLists = async () => {
    try {
      const token = sessionStorage.getItem('userToken');
      if (!token) {
        console.error('No JWT token found');
        return;
      }

      const publicResponse = await axios.post(
        'http://localhost:5000/api/songs/getList',
        { isPublic: true, offset: 0 }, // body 부분
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const privateResponse = await axios.post(
        'http://localhost:5000/api/songs/getList',
        { isPublic: false, offset: 0 }, // body 부분
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSongLists({
        public: publicResponse.data,
        private: privateResponse.data,
      });
    } catch (error) {
      console.error('Error fetching song lists:', error);
    }
  };
  fetchSongLists();
  const handleSongSelect = (song) => {
    setSelectedSong(song);
  };

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
