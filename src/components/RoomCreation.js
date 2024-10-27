// src/components/RoomCreation.js
import React, { useState } from 'react';
import axios from 'axios';
import '../css/RoomCreation.css';

function RoomCreation({ onCancel }) {
  const [roomTitle, setRoomTitle] = useState('');
  const [roomPassword, setRoomPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    //토큰 가져오기
    const token = sessionStorage.getItem('userToken');
      if (!token) {
        alert('No JWT token found');
        console.error('No JWT token found');
        onCancel(); // 토큰이 없을 경우 onCancel 호출
        return; // 함수 실행 중단
      }

    try {
      const response = await axios.post(
        '/api/rooms/create',
        { roomTitle, roomPassword }, // data
        {
          headers: {
            'Authorization': `Bearer ${token}`, // 가져온 토큰을 헤더에 추가
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        const { roomId } = response.data;
        alert(`Room created successfully! Room ID: ${roomId}`);
        
        // 해당 방으로 이동
      } else {
        alert('Failed to create room');
        onCancel(); // 토큰이 없을 경우 onCancel 호출
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating room');
      onCancel(); // 토큰이 없을 경우 onCancel 호출
    }
  };

  return (
    <div className='room-creation-background'>
      <div className="room-creation-window">
        <h2>방 생성</h2>
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
            비밀번호:
            <input
              type="text"
              name="roomPassword"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
            />
          </label>
          <button type="submit">생성</button>
          <button type="button" onClick={onCancel}>취소</button>
        </form>
      </div>
    </div>
  );
}

export default RoomCreation;