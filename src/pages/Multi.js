import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";
import Sidebar from "../components/SideBar";
import RoomCreation from "../components/RoomCreation";
import { useNavigate } from "react-router-dom";
import { useScreen } from "../Context/ScreenContext";
import "../css/Multi.css";
import MobileNav from "../components/MobileNav";
import PageTemplate from "../template/PageTemplate";

function Multi() {
  const [rooms, setRooms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false); // 방 생성 상태
  const roomsPerPage = 10;

  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { isMobile } = useScreen();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchRooms = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("userToken");
      if (!token) {
        alert("No JWT token found");
        console.error("No JWT token found");
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_ENDPOINT}/rooms/getList`,
        { offset: (currentPage - 1) * roomsPerPage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("response.data.rooms", response.data.rooms);
      setRooms(response.data.rooms);
    } catch (error) {
      alert("Error fetching rooms:");
      console.error("Error fetching rooms:", error);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handlePlay = (e, roomId, roomPassword) => {
    e.stopPropagation();
    if (roomPassword === "")
      navigate(`/multiplay/${roomId}`, {
        replace: true,
      }); // 상태와 함께 네비게이션
    else {
      // 비밀번호가 있는 경우 팝업으로 확인
      const userPassword = prompt("방 비밀번호를 입력하세요:");

      if (userPassword === roomPassword) {
        navigate(`/multiplay/${roomId}`, { replace: true });
      } else if (userPassword !== null) {
        // 취소 버튼이 아닌 경우
        alert("비밀번호가 일치하지 않습니다.");
      }
    }
  };

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
    <PageTemplate
      isMobile={isMobile}
      isSidebarOpen={isSidebarOpen}
      toggleSidebar={toggleSidebar}
      current={"multi"}
    >
      {isCreatingRoom ? (
        <RoomCreation onCancel={() => setIsCreatingRoom(false)} />
      ) : (
        <div className="main-area">
          <button className="page-button" onClick={handlePreviousPage}>
            <i className="fa-solid fa-circle-chevron-left"></i>
          </button>

          <div className="room-list">
            {roomCards.map((room, index) => (
              <div
                className={`room-card ${room.empty ? "empty" : ""}`}
                key={room.empty ? `empty-${index}` : room.id}
              >
                {room.empty ? (
                  <div className="room-info-empty">빈 방</div>
                ) : (
                  <div
                    onClick={(e) => handlePlay(e, room.id, room.password)}
                    className="room-content"
                  >
                    <img
                      className="thumbnail"
                      src={room.image}
                      alt={`Thumbnail for ${room.roomTitle}`}
                    />
                    <div className="room-info">
                      <h3>{room.roomTitle}</h3>
                      <p>
                        Players: {room.users.length}/{room.max_user}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="page-button" onClick={handleNextPage}>
            <i className="fa-solid fa-circle-chevron-right"></i>
          </button>
        </div>
      )}

      <div className={`bottom-buttons ${isSidebarOpen ? "shifted" : ""}`}>
        <button className="quick-join">빠른 입장</button>
        <button className="sort-by">정렬 조건</button>
        <button className="create-room" onClick={() => setIsCreatingRoom(true)}>
          방 생성
        </button>
        <button className="refresh" onClick={fetchRooms}>
          새로고침
        </button>
      </div>
    </PageTemplate>
  );
}

export default Multi;
