import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SongList.css';

function SongList({ onSongSelect, searchTerm, songs }) {
  const navigate = useNavigate();
  const handlePlay = (e, song) => {
    e.stopPropagation();

    navigate(`/play/${song.id}`, { state: { song } }); // 상태와 함께 네비게이션
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
  const filteredSongs = songs.filter((song) => song.metadata.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className='song-list'>
      {filteredSongs.length === 0 ? (
        <div
          className='add-song-banner'
          onClick={() => {
            navigate('/add');
          }}>
          <div className='add-song-icon'>+</div>
          <div className='add-song-text'>
            <h4>곡을 추가하세요</h4>
            <p>곡 추가를 위해 여기를 클릭하세요.</p>
          </div>
        </div>
      ) : (
        filteredSongs.map((song) => (
          <div key={song.id} className='song-item' onClick={() => onSongSelect(song)}>
            <div className='song-icon'
              style={{
                backgroundImage: `url(data:image/jpeg;base64,${arrayBufferToBase64(song.image.data)})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                width: '3rem',          // 원하는 크기로 설정
                height: '3rem'
              }}
              alt={song.metadata.title}
            />

            <div className='song-info'>
              <h3>{song.metadata.title}</h3>
              <p>{song.metadata.description}</p>

              <span className='timestamp'>{song.timestamp}</span>
            </div>
            <div className='play-button has-text-dark' onClick={(e) => handlePlay(e, song)}>
            <i class="fa-solid fa-play"></i>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default SongList;
