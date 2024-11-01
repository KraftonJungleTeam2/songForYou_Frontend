import React, { useState } from 'react';
import SongList from './SongList';
import '../css/SongListArea.css';
import { useNavigate } from 'react-router-dom';

function SongListArea({ onSongSelect, publicSongs, privateSongs }) {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState('public');
  const [searchTerm, setSearchTerm] = useState('');

  const handleTabClick = (view) => {
    setViewType(view);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className='song-list-area'>
      <div className='top-section'>
        <div className='tabs' style={{ paddingBottom: '1px', margin: '0rem auto 0rem 0rem' }}>
          <li className={viewType === 'public' ? 'is-active' : ''} onClick={() => handleTabClick('public')}>
            <a>공개 노래</a>
          </li>
          <li className={viewType === 'private' ? 'is-active' : ''} onClick={() => handleTabClick('private')}>
            <a>내 노래</a>
          </li>
        </div>
        <div className='search-bar'>
          <input type='text' placeholder='노래 검색' value={searchTerm} onChange={handleSearch} />
          <button className='button is-dark'>
            <i className='fa-solid fa-magnifying-glass'></i>
          </button>
        </div>
        <button className='button is-link add-song-button' onClick={() => navigate('/add')}>
          <i className='fa-solid fa-upload'></i> 노래 올리기
        </button>
      </div>
      <SongList searchTerm={searchTerm} onSongSelect={onSongSelect} songs={viewType === 'public' ? publicSongs : privateSongs} />
    </div>
  );
}

export default SongListArea;
