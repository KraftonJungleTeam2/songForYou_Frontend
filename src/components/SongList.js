import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SongList.css';

function SongList({ viewType, onSongSelect, searchTerm, songs }) {
  const navigate = useNavigate();
  const handlePlay = (e, songId) => {
    e.stopPropagation();

    navigate(`/play/${songId}`);
  };
  console.log(songs)
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
            <div className='song-icon'>▲■●</div>
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
