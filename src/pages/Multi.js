import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import TopBar from '../components/TopBar';
import Sidebar from '../components/SideBar';
import RoomCreation from '../components/RoomCreation';
import { useNavigate } from 'react-router-dom';
import { useScreen } from '../Context/ScreenContext';
import '../css/Multi.css';
import MobileNav from '../components/MobileNav';
import PageTemplate from '../template/PageTemplate';

function Multi() {
  const [rooms, setRooms] = useState([]);
  const [roomCards, setRoomCards] = useState(rooms);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false); // 방 생성 상태
  const roomsPerPage = 10;

  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { isMobile } = useScreen();

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
  }, []);

  const handlePlay = (e, roomId, roomPassword) => {
    e.stopPropagation();
    if (roomPassword === '')
      navigate(`/multiplay/${roomId}`, {
        replace: true,
      });
    // 상태와 함께 네비게이션
    else {
      // 비밀번호가 있는 경우 팝업으로 확인
      const userPassword = prompt('방 비밀번호를 입력하세요:');

      if (userPassword === roomPassword) {
        navigate(`/multiplay/${roomId}`, { replace: true });
      } else if (userPassword !== null) {
        // 취소 버튼이 아닌 경우
        alert('비밀번호가 일치하지 않습니다.');
      }
    }
  };

  useEffect(() => {
    const temp = rooms.filter((room) =>
      room.roomTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
    while (temp.length < 1) {
      temp.push({ roomId: `empty-${temp.length}`, empty: true });
    }

    setRoomCards(temp);
  }, [searchTerm, rooms]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <PageTemplate isMobile={isMobile} isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} current={'multi'}>
      {isCreatingRoom ? <RoomCreation onCancel={() => setIsCreatingRoom(false)} /> : ''}
      <div className='main-area'>
        <div id='room-list-container' className='component-container'>
          <div className='top-section room'>
            <div className='search-bar'>
              <input type='text' placeholder='검색' value={searchTerm} onChange={handleSearch} />
              <button className='search-button'>
                <i className='fa-solid fa-magnifying-glass'></i>
              </button>
            </div>
            <div className="buttons-room">
              <button
                className="button is-normal button-refresh"
                onClick={fetchRooms}
              >
                <i className="fa-solid fa-rotate-right"></i>
              </button>
              <button
                className="button is-highlight button-create"
                onClick={() => setIsCreatingRoom(true)}
              >
                <i className={`fa-solid fa-plus`}></i> 방 만들기
              </button>
            </div>
          </div>
          <div className="room-list">
            {roomCards.map((room, index) =>
              room.empty ? (
                <div
                  className={`room-card empty`}
                  key={room.empty ? `empty-${index}` : room.id}
                >
                  <div className="room-content">
                    <h3>방 없음</h3>
                  </div>
                </div>
              ) : (
                <div
                  className={`room-card ${room.empty ? "empty" : ""}`}
                  key={room.empty ? `empty-${index}` : room.id}
                  onClick={(e) => handlePlay(e, room.id, room.password)}
                >
                  <div className="room-content">
                    <div className="room-info">
                      <h3>{room.roomTitle}</h3>
                      <span>
                        {Array.from({ length: room.max_user }, (_, index) =>
                          index < room.users.length ? (
                            <i className="fa-solid fa-user"></i>
                          ) : (
                            <i className="fa-regular fa-user"></i>
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}

export default Multi;
