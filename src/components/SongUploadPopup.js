import React, { useState, useRef } from 'react';
import '../css/SongUploadPopup.css';

function SongUploadPopup({ onClose, onFileUpload }) {
  const [file, setFile] = useState(null);
  const [youtubeLink, setYoutubeLink] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'audio/mpeg' || droppedFile.type === 'audio/wav')) {
      setFile(droppedFile);
    } else {
      alert('올바른 오디오 파일(.mp3 또는 .wav)을 선택해주세요.');
    }
  };

  const handleYoutubeLinkChange = (e) => {
    setYoutubeLink(e.target.value);
  };

  const handleUpload = async () => {
    if (file) {
      onFileUpload(file);
      onClose();
    } else if (youtubeLink) {
      try {
        console.log('Sending request to server');
        const response = await fetch('http://localhost:5000/extract-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: youtubeLink })
        });

        console.log('Response received:', response);

        if (response.ok) {
          const data = await response.json(); // JSON 응답을 파싱
          console.log('Server response:', data); // 서버 응답 확인
  
          const blob = await fetch(data.url).then(r => r.blob());
          const fileName = `youtube_audio_${Date.now()}.mp3`;
          const audioFile = new File([blob], fileName, { type: 'audio/mpeg' });
          
          onFileUpload(audioFile);
          alert('유튜브 오디오가 성공적으로 추출되었습니다.');
          onClose();
        } else {
          const errorData = await response.json(); // 오류 메시지 파싱
          console.error('Server error response:', errorData); // 서버 오류 응답 확인
          throw new Error(errorData.error || 'Failed to extract audio');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('음원 추출에 실패했습니다.');
      }
    } else {
      alert('파일을 선택하거나 유튜브 링크를 입력하세요.');
    }
  };

  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="song-upload-popup">
      <div className="popup-content">
        <h3>곡 추가</h3>
        <div 
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          {file ? file.name : '파일을 여기에 드래그하거나 클릭하여 선택하세요'}
        </div>
        <input 
          type="file" 
          ref={fileInputRef}
          accept=".mp3,.wav" 
          onChange={handleFileChange} 
          style={{ display: 'none' }}
        />
        <div className="youtube-link-input">
          <input 
            type="text" 
            placeholder="또는 유튜브 링크를 입력하세요" 
            value={youtubeLink}
            onChange={handleYoutubeLinkChange}
          />
        </div>
        <button onClick={handleUpload}>업로드</button>
        <button onClick={onClose}>취소</button>
      </div>
    </div>
  );
}

export default SongUploadPopup;