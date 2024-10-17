import React, { useState } from 'react';
import SongList from './SongList';
import '../css/SongListArea.css';
import SongUploadPopup from './SongUploadPopup';

function SongListArea({ onSongSelect }) {
  const [viewType, setViewType] = useState('private');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSongs, setHasSongs] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
  const handleTabClick = (view) => {
    setViewType(view);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSongDataStatus = (status) => {
    setHasSongs(status);
  };

  const handleOpenPopup = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const handleFileUpload = (file) => {
    // 여기에 파일 업로드 로직을 구현합니다.
    console.log('File uploaded:', file.name);
    // 예를 들어, API 호출을 통해 서버에 파일을 업로드할 수 있습니다.
  };

  return (
    <div className="song-list-area">
      <div className="top-section">
        <div className="tabs">
          <button
            className={viewType === 'private' ? 'active' : ''}
            onClick={() => handleTabClick('private')}
          >
            Private
          </button>
          <button
            className={viewType === 'public' ? 'active' : ''}
            onClick={() => handleTabClick('public')}
          >
            Public
          </button>
        </div>
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Hinted search text" 
            value={searchTerm}
            onChange={handleSearch}
          />
          <button>🔍</button>
        </div>
        <button className="add-song-button" onClick={handleOpenPopup}>+ 곡 추가</button>
      </div>
      <SongList 
        viewType={viewType} 
        searchTerm={searchTerm} 
        onSongSelect={onSongSelect} 
        onSongDataStatus={handleSongDataStatus}
        onOpenPopup={handleOpenPopup} // 팝업 열기 함수 전달
      />
      {isPopupOpen && (
        <SongUploadPopup
          onClose={handleClosePopup}
          onFileUpload={handleFileUpload}
        />
      )}
    </div>
  );
}

export default SongListArea;