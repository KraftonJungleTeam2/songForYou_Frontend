import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SongList.css';

// 더미 데이터
const publicSongsData = [
  {
    id: 1,
    title: "Public Song 1",
    description: "This is a public song description.",
    timestamp: "Today • 23 min",
  },
  {
    id: 2,
    title: "Public Song 2",
    description: "Another public song description.",
    timestamp: "Yesterday • 1 hour",
  },
];

const privateSongsData = [
  // 예를 들어 곡이 비어 있는 경우
  // {
  //   id: 101,
  //   title: "Private Song 1",
  //   description: "This is a private song description.",
  //   timestamp: "2 days ago • 30 min",
  // },
];

function SongList({ viewType, onSongSelect, searchTerm, onSongDataStatus, onOpenPopup }) {
  const navigate = useNavigate();

  const handlePlay = (e, songId) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    
    if(viewType === 'private'){
    navigate(`/play/${songId}`);
    }
    else{
      navigate(`/play/public/${songId}`);
    }
  };

  // viewType에 따라 적절한 데이터 선택
  const songsData = viewType === 'public' ? publicSongsData : privateSongsData;

  // 검색 필터링
  const filteredSongs = songsData.filter((song) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 데이터가 있는지 여부를 부모에게 전달
  useEffect(() => {
    onSongDataStatus(filteredSongs.length > 0);
  }, [filteredSongs, onSongDataStatus]);

  const handleAddSongClick = () => {
    onOpenPopup(); // 팝업 열기
  };

  return (
    <div className="song-list">
      {viewType === 'private' && filteredSongs.length === 0 ? (
        <div className="add-song-banner" onClick={handleAddSongClick}>
          <div className="add-song-icon">+</div>
          <div className="add-song-text">
            <h4>곡을 추가하세요</h4>
            <p>개인 곡 추가를 위해 여기를 클릭하세요.</p>
          </div>
        </div>
      ) : (
        filteredSongs.map((song) => (
          <div
            key={song.id}
            className="song-item"
            onClick={() => onSongSelect(song)}
          >
            <div className="song-icon">▲■●</div>
            <div className="song-info">
              <h4>{song.title}</h4>
              <p>{song.description}</p>
              <span className="timestamp">{song.timestamp}</span>
            </div>
            <div className="play-button" onClick={(e) => handlePlay(e, song.id)}>▶</div>
          </div>
        ))
      )}
    </div>
  );
}

export default SongList;