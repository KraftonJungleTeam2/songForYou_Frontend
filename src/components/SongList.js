import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SongList.css';

function SongList({ viewType, onSongSelect, searchTerm, songs }) {
  const navigate = useNavigate();
  const handlePlay = (e, songId) => {
    e.stopPropagation();

    navigate(`/play/${songId}`);
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
  
  console.log('filteredSongs', filteredSongs);
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
            <div className='song-icon'>
              {song.image && song.image.data ? (
                <img src={`data:image/jpeg;base64,${arrayBufferToBase64(song.image.data)}`} alt={song.metadata.title} width='200' />
              ) : (
                <div>No Image Available</div> // 이미지가 없을 경우 대체 내용
              )}{' '}
            </div>

            <div className='song-info'>
              <h4>{song.metadata.title}</h4>
              <p>{song.metadata.description}</p>

              <span className='timestamp'>{song.timestamp}</span>
            </div>
            <div className='play-button' onClick={(e) => handlePlay(e, song.id)}>
              ▶
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default SongList;
