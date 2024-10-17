import React, { useState } from 'react';
import '../css/SongUploadPopup.css';

function SongUploadPopup({ onClose, onFileUpload }) {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (file) {
      onFileUpload(file);
      onClose(); // 파일 업로드 후 팝업 닫기
    } else {
      alert('파일을 선택하세요.');
    }
  };

  return (
    <div className="song-upload-popup">
      <div className="popup-content">
        <h3>곡 추가</h3>
        <input type="file" accept=".mp3,.wav" onChange={handleFileChange} />
        <button onClick={handleUpload}>업로드</button>
        <button onClick={onClose}>취소</button>
      </div>
    </div>
  );
}

export default SongUploadPopup;