import React from 'react';
import '../css/Preview.css';

function Preview({ selectedSong }) {
  if (!selectedSong) {
    return <div className="preview">Select a song to see details</div>;
  }

  return (
    <div className="preview">
      <h3>{selectedSong.title}</h3>
      <div className="preview-icon">▲■●</div>
      <p>{selectedSong.description}</p>
      <div className="preview-buttons">
        <button className="enabled">Enabled</button>
        <button className="enabled purple">Enabled</button>
      </div>
    </div>
  );
}

export default Preview;