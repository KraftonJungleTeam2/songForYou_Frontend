import React, { useState } from 'react';
import TopBar from '../components/TopBar';
import Sidebar from '../components/SideBar';
import '../css/Multi.css';

function Multi() {
  const rooms = [
    { id: 1, thumbnail: 'thumb1.png', title: 'Room 1', players: '2/7', song: 'Song A' },
    { id: 2, thumbnail: 'thumb2.png', title: 'Room 2', players: '3/7', song: 'Song B' },
    { id: 3, thumbnail: 'thumb3.png', title: 'Room 3', players: '4/7', song: 'Song C' },
    // 10개 정도의 방 목록이 필요하면 더 추가합니다.
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 10; // 페이지당 방 개수

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    // 총 페이지 수에 맞춰 페이지 이동 제어
    setCurrentPage(currentPage + 1);
  };

  // 빈 카드를 채워서 항상 10개의 카드를 유지하도록 함
  const roomCards = [...rooms];
  while (roomCards.length < roomsPerPage) {
    roomCards.push({ id: `empty-${roomCards.length}`, empty: true }); // 빈 방 카드
  }

  return (
    <div className='single-page'>
      <Sidebar />
      <div className='main-content'>
        <TopBar />
        <div className='content-area-multi'>
          <div className='main-area'>
            <button onClick={handlePreviousPage}>Previous Page</button> 
            <div className="room-list">
              {roomCards.map((room, index) => (
                <div className={`room-card ${room.empty ? 'empty' : ''}`} key={room.id}>
                  {room.empty ? (
                    <div className="room-info-empty">빈 방</div>
                  ) : (
                    <>
                      <img className="thumbnail" src={room.thumbnail} alt={`Thumbnail for ${room.title}`} />
                      <div className="room-info">
                        <h3>{room.title}</h3>
                        <p>Players: {room.players}</p>
                        <p>Song: {room.song}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <button onClick={handleNextPage}>Next Page</button>
          </div>
          
          <div className="bottom-buttons">
            <button className="quick-join">빠른 입장</button>
            <button className='sort-by'> 정렬 조건</button>
            <button className="create-room">방 생성</button>
            <button className="refresh">새로고침</button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Multi;
