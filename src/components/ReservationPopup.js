import React, { useEffect, useState } from 'react';
import { useSongs } from '../Context/SongContext';

const ReservationPopup = ({ soket, onClose }) => {
  const { songLists, fetchSongLists } = useSongs();
  const [viewType, setViewType] = useState('public');
  const [searchTerm, setSearchTerm] = useState('');

  // songContext에서 노래 정보를 불러옴
  useEffect(() => {
    fetchSongLists();
  }, [fetchSongLists]);

  const handleTabClick = (view) => {
    setViewType(view);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleReserve = (e, song) => {
    e.stopPropagation();
    // 곡 예약 정보 소켓으로 전달하기
    soket.emit('reserveSong', )
    onClose();
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

  const filteredSongs = (viewType === 'public' ? songLists.public : songLists.private).filter((song) =>
    song.metadata.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.overlay}>
        <div style={styles.popup}>
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
                                width: '4rem',
                                height: '4rem',
                                }}
                                alt={song.metadata.title}
                            />

                        <div className='song-info'>
                            <h3>{song.metadata.title}</h3>
                            <p>{song.metadata.description}</p>
                            <span className='timestamp'>{song.timestamp}</span>
                        </div>
                            <div 
                                className='play-button has-text-success' 
                                style={{ cursor: 'pointer' }} 
                                onClick={(e) => handleReserve(e, song)}
                                >
                                <i className="fa-solid fa-plus"></i> {/* 플러스 아이콘 */}
                            </div>

                        </div>
                    ))
                    )}
                </div>

                
            </div>


            <button className='button' onClick={onClose}>닫기</button>
        </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popup: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    width: '40rem',
    height: '80%',
    textAlign: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
};

export default ReservationPopup;
