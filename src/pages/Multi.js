import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import TopBar from '../components/TopBar';
import Sidebar from '../components/SideBar';
import RoomCreation from '../components/RoomCreation';
import '../css/Multi.css';

function Multi() {
  const [rooms, setRooms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false); // 방 생성 상태
  const roomsPerPage = 10;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchRooms = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('userToken');
      if (!token) {
        alert('No JWT token found');
        console.error('No JWT token found');
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_ENDPOINT}/rooms/getList`,
        { offset: (currentPage - 1) * roomsPerPage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setRooms(response.data.rooms);
    } catch (error) {
      alert('Error fetching rooms:');
      console.error('Error fetching rooms:', error);
    }
  }, [currentPage]);

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
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`main-content ${isSidebarOpen ? 'shifted' : ''}`}>
        <TopBar />
        <div className='content-area-multi'>
          {isCreatingRoom ? (
            <RoomCreation onCancel={() => setIsCreatingRoom(false)} /> // 방 생성 화면
          ) : (
            <div className='main-area'>
              <button className='button page-button is-white' onClick={handlePreviousPage}>
                <i class='fa-solid fa-circle-chevron-left'></i>
              </button>
              <div className='grid is-col-min-20 room-list'>
                {roomCards.map((room, index) => (
                  <div className={`cell has-background-light room-card ${room.empty ? 'empty' : ''}`} key={room.roomId}>
                    {room.empty ? (
                      <div className='room-info-empty has-text-light-invert'>빈 방</div>
                    ) : (
                      <>
                        <img className='thumbnail' src={room.image} alt={`Thumbnail for ${room.name}`} />
                        <div className='room-info'>
                          <h3>{room.name}</h3>
                          <p>Players: {room.users.length}/4</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <button className='button page-button is-white' onClick={handleNextPage}>
                <i class='fa-solid fa-circle-chevron-right'></i>
              </button>
            </div>
          )}

          <div className={`bottom-buttons ${isSidebarOpen ? 'shifted' : ''}`}>
            <button className='quick-join'>빠른 입장</button>
            <button className='sort-by'> 정렬 조건</button>
            <button className='create-room' onClick={() => setIsCreatingRoom(true)}>
              방 생성
            </button>
            <button className='refresh' onClick={fetchRooms}>
              새로고침
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Multi;
