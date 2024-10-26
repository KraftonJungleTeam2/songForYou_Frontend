import React, { useState, useRef, useEffect } from 'react';
import '../css/Preview.css';
import { useNavigate } from 'react-router-dom';

function Preview({ selectedSong }) {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  // 컴포넌트 언마운트 시 URL 정리
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // selectedSong이 변경될 때 오디오 상태 초기화
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [selectedSong]);

  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  const handlePlay = (e, song) => {
    e.stopPropagation();

    navigate(`/play/${song.id}`, { state: { song } }); // 상태와 함께 네비게이션
  };

  const handlePreview = async (e, songId) => {
    e.stopPropagation();

    try {
      // 이미 재생 중이면 중지
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        return;
      }

      // 재생 전에 현재 오디오를 완전히 중지하고 초기화
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.load();
      }

      // 오디오 URL이 없는 경우에만 새로 요청
      const response = await fetch('http://localhost:5000/api/songs/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId: songId }),
      });

      if (!response.ok) {
        throw new Error('Preview request failed');
      }

      const audioBlob = await response.blob();
      // 이전 URL 해제
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // URL이 설정된 후 audio 엘리먼트 다시 로드
      audioRef.current.load();

      // 약간의 지연 후 재생 시작
      setTimeout(() => {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error('Failed to play audio:', error);
            setIsPlaying(false);
          });
      }, 100);
    } catch (error) {
      console.error('Error playing preview:', error);
      setIsPlaying(false);
    }
  };

  // 오디오 재생 완료 시 처리
  const handleAudioEnded = () => {
    setIsPlaying(false);
    audioRef.current.currentTime = 0;
  };

  if (!selectedSong) {
    return <div className='preview'>Select a song to see details</div>;
  }

  return (
    <div className='preview'>
      <h3>{selectedSong.metadata.title}</h3>
      <div className='song-icon'>{selectedSong.image && selectedSong.image.data ? <img src={`data:image/jpeg;base64,${arrayBufferToBase64(selectedSong.image.data)}`} alt={selectedSong.metadata.title} width='200' /> : <div>No Image Available</div>}</div>
      <p>{selectedSong.metadata.description}</p>
      <audio ref={audioRef} src={audioUrl} onEnded={handleAudioEnded} style={{ display: 'none' }} />
      <div className='preview-buttons'>
        <button className={`enabled ${isPlaying ? 'playing' : ''}`} onClick={(e) => handlePreview(e, selectedSong.id)}>
          {isPlaying ? 'Stop Preview' : 'Preview'}
        </button>

        <button className='enabled purple' onClick={(e) => handlePlay(e, selectedSong)}>
          Play
        </button>
      </div>
    </div>
  );
}

export default Preview;
