import React, { useState } from 'react';
import SongList from './SongList';
import '../css/SongListArea.css';
import SongUploadPopup from './SongUploadPopup';

function SongListArea({ onSongSelect, publicSongs, privateSongs }) {
  const [viewType, setViewType] = useState('private');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleTabClick = (view) => {
    setViewType(view);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenPopup = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const handleFileUpload = (file) => {
    // 파일 업로드 로직 구현
    console.log('File uploaded:', file.name);
  };

  return (
    <div className='song-list-area'>
      <div className='top-section'>
        <div className='tabs'>
          <button className={viewType === 'private' ? 'active' : ''} onClick={() => handleTabClick('private')}>
            Private
          </button>
          <button className={viewType === 'public' ? 'active' : ''} onClick={() => handleTabClick('public')}>
            Public
          </button>
        </div>
        <div className='search-bar'>
          <input type='text' placeholder='Hinted search text' value={searchTerm} onChange={handleSearch} />
          <button>🔍</button>
        </div>
        <button className='add-song-button' onClick={handleOpenPopup}>
          + 곡 추가
        </button>
      </div>
      <SongList viewType={viewType} searchTerm={searchTerm} onSongSelect={onSongSelect} songs={viewType === 'public' ? publicSongs : privateSongs} onOpenPopup={handleOpenPopup} />
      {isPopupOpen && <SongUploadPopup onClose={handleClosePopup} onFileUpload={handleFileUpload} />}
    </div>
  );
}

export default SongListArea;
