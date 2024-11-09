// src/components/RoomCreation.js
import React, { useState } from "react";
import axios from "axios";
import "../css/RoomCreation.css";
import { useNavigate } from "react-router-dom";

function RoomCreation({ onCancel }) {
  const [roomTitle, setRoomTitle] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [max_peers, setMax_peers] = useState(4);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();

    //토큰 가져오기
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      alert("No JWT token found");
      console.error("No JWT token found");
      onCancel(); // 토큰이 없을 경우 onCancel 호출
      return; // 함수 실행 중단
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_ENDPOINT}/rooms/create`,
        {
          roomTitle: roomTitle,
          password: roomPassword,
          max_peers,
          is_public: true,
        }, // data
        {
          headers: {
            Authorization: `Bearer ${token}`, // 가져온 토큰을 헤더에 추가
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        const { roomId } = response.data;
        alert(`Room created successfully! Room ID: ${roomId}`);
        navigate(`/multiplay/${roomId}`, { replace: true }); // 상태와 함께 네비게이션
        // 해당 방으로 이동
      } else {
        alert("Failed to create room");
        onCancel(); // 토큰이 없을 경우 onCancel 호출
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating room");
      onCancel(); // 토큰이 없을 경우 onCancel 호출
    }
  };

  return (
    <div className="room-creation-background">
      <div className="room-creation-window">
        <div className="close-button is-ghost" onClick={onCancel}><i className="fa-solid fa-xmark"></i></div>
        <h2>방 만들기</h2>
        <form onSubmit={handleSubmit}>
          <label>
            방 제목:
            <input
              type="text"
              name="roomTitle"
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              required
            />
          </label>
          <label>
            최대 인원:
            <input
              type="number"
              min={2}
              max={4}
              name="roomTitle"
              value={max_peers}
              onChange={(e) => setMax_peers(e.target.value)}
              required
            />
          </label>
          <label>
            비밀번호:
            <input
              type="password"
              name="roomPassword"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="button is-highlight">만들기</button>
        </form>
      </div>
    </div>
  );
}

export default RoomCreation;
