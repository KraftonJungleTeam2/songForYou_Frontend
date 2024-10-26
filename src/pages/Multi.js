import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import TopBar from '../components/TopBar';
import Sidebar from '../components/SideBar';
import '../css/Multi.css';

function Multi() {
  const [rooms, setRooms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 10;

  // 방 목록 가져오는 함수 - useCallback으로 메모이제이션
  const fetchRooms = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('userToken');
      if (!token) {
        alert('No JWT token found');
        console.error('No JWT token found');
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/rooms/getlist',
        { offset: (currentPage - 1) * roomsPerPage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setRooms(response.data);
    } catch (error) {
      alert('Error fetching rooms:');
      console.error('Error fetching rooms:', error);
    }
  }, [currentPage]);

  // 페이지 변경될 때마다 방 목록 가져오기
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const roomCards = [...rooms];
  while (roomCards.length < roomsPerPage) {
    roomCards.push({ roomId: `empty-${roomCards.length}`, empty: true });
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
                <div className={`room-card ${room.empty ? 'empty' : ''}`} key={room.roomId}>
                  {room.empty ? (
                    <div className="room-info-empty">빈 방</div>
                  ) : (
                    <>
                      <img className="thumbnail" src={room.image} alt={`Thumbnail for ${room.roomTitle}`} />
                      <div className="room-info">
                        <h3>{room.roomTitle}</h3>
                        <p>Players: {room.players}/5</p>
                        <p>Song: {room.playingsongTitle}</p>
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
            <button className="refresh" onClick={fetchRooms}>새로고침</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Multi;
