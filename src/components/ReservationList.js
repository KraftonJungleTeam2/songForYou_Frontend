import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SongListArea.css';

function ReservationList({publicSongs, privateSongs }) {
  const [viewType, setViewType] = useState('public');
  const [searchTerm, setSearchTerm] = useState('');
  

  const handleTabClick = (view) => {
    setViewType(view);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleReserve = (e, song) => {
    e.stopPropagation();
    
    // 곡 예약 정보 소켓으로 전달하기
  };

  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  const filteredSongs = (viewType === 'public' ? publicSongs : privateSongs).filter((song) =>
    song.metadata.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
        </div>
      </div>

      <div className='song-list'>
        {filteredSongs.length === 0 ? (
          <p>노래가 없습니다.</p>
        ) : (
          filteredSongs.map((song) => (
            <div key={song.id} className='song-item'>
              <div
                className='song-icon'
                style={{
                  backgroundImage: `url(data:image/jpeg;base64,${arrayBufferToBase64(song.image.data)})`,
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  width: '3rem',
                  height: '3rem',
                }}
                alt={song.metadata.title}
              />

              <div className='song-info'>
                <h3>{song.metadata.title}</h3>
                <p>{song.metadata.description}</p>
                <span className='timestamp'>{song.timestamp}</span>
              </div>
              <div className='play-button has-text-dark' onClick={(e) => handleReserve(e, song)}>
                <i className='fa-solid fa-play'></i>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ReservationList;
