import React from 'react';
import '../css/Preview.css';
import { useNavigate } from 'react-router-dom';

function Preview({ selectedSong }) {
  const navigate = useNavigate();
  if (!selectedSong) {
    return <div className='preview'>Select a song to see details</div>;
  }
  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  const handlePlay = (e, song) => {
    e.stopPropagation();

    navigate(`/play/${song.id}`, { state: { song } }); // 상태와 함께 네비게이션
  };
  return (
    <div className='preview'>
      <h3>{selectedSong.metadata.title}</h3>{' '}
      <div className='song-icon'>
        {selectedSong.image && selectedSong.image.data ? (
          <img src={`data:image/jpeg;base64,${arrayBufferToBase64(selectedSong.image.data)}`} alt={selectedSong.metadata.title} width='200' />
        ) : (
          <div>No Image Available</div> // 이미지가 없을 경우 대체 내용
        )}{' '}
      </div>
      <p>{selectedSong.metadata.description}</p>
      <div className='preview-buttons'>
        <button className='enabled' onClick={(e) => handlePlay(e, selectedSong.id)}>
          Preview
        </button>
        <button className='enabled purple' onClick={(e) => handlePlay(e, selectedSong)}>
          Play
        </button>
      </div>
    </div>
  );
}

export default Preview;
