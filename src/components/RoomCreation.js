// src/components/RoomCreation.js
import React from 'react';
import '../css/RoomCreation.css'; // 필요 시 스타일 파일 추가

function RoomCreation({ onCancel }) {
  return (
    <div className='room-creation-background'>
        <div className="room-creation-window">
        <h2>방 생성</h2>
        <form>
            <label>
            방 제목:
            <input type="text" name="roomTitle" required />
            </label>
            <label>
            비밀번호:
            <input type="password" name="roomPassword" required />
            </label>
            <button type="submit">생성</button>
            <button type="button" onClick={onCancel}>취소</button>
        </form>
        </div>
    </div>
  );
}

export default RoomCreation;
