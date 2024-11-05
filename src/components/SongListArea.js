import React, { useState } from 'react';
import SongList from './SongList';
import '../css/SongListArea.css';
import { useNavigate } from 'react-router-dom';
import { useScreen } from '../Context/ScreenContext';

function SongListArea({ onSongSelect, publicSongs, privateSongs }) {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState('public');
  const [searchTerm, setSearchTerm] = useState('');
  const { isPhone } = useScreen();

  const handleTabClick = (view) => {
    setViewType(view);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className='song-list-area'>
      {isPhone ? (
        <div className='top-section-mobile'>
          <div className='tabs-upload'>
            <div className='custom-tabs'>
              <button
                className={`tab-button ${viewType === 'public' ? 'is-active' : ''}`}
                onClick={() => handleTabClick('public')}
              >
                공개 노래
              </button>
              <button
                className={`tab-button ${viewType === 'private' ? 'is-active' : ''}`}
                onClick={() => handleTabClick('private')}
              >
                내 노래
              </button>
            </div>
            <button className='add-song-button' onClick={() => navigate('/add')}>
              <i className='fa-solid fa-upload'></i> 노래 올리기
            </button>
          </div>
          <div className='search-bar'>
            <input type='text' placeholder='노래 검색' value={searchTerm} onChange={handleSearch} />
            <button className='search-button'>
              <i className='fa-solid fa-magnifying-glass'></i>
            </button>
          </div>
        </div>
      ) : (
        <div className='top-section'>
          <div className='custom-tabs'>
            <button
              className={`tab-button ${viewType === 'public' ? 'is-active' : ''}`}
              onClick={() => handleTabClick('public')}
            >
              공개 노래
            </button>
            <button
              className={`tab-button ${viewType === 'private' ? 'is-active' : ''}`}
              onClick={() => handleTabClick('private')}
            >
              내 노래
            </button>
          </div>
          <div className='search-bar'>
            <input type='text' placeholder='노래 검색' value={searchTerm} onChange={handleSearch} />
            <button className='search-button'>
              <i className='fa-solid fa-magnifying-glass'></i>
            </button>
          </div>
          <button className='add-song-button' onClick={() => navigate('/add')}>
            <i className='fa-solid fa-upload'></i> 노래 올리기
          </button>
        </div>
      )}
      <SongList
        searchTerm={searchTerm}
        onSongSelect={onSongSelect}
        songs={viewType === 'public' ? publicSongs : privateSongs}
      />
    </div>
  );
}

export default SongListArea;
