// Preview.js
import React, { useState, useRef, useEffect } from "react";
import "../css/Preview.css";
import { useNavigate } from "react-router-dom";
import { useScreen } from "../Context/ScreenContext";

function Preview({ selectedSong }) {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const { isMobile } = useScreen();

  // 컴포넌트 언마운트 시 오디오 URL 정리
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

  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const handlePlay = (e, song) => {
    e.stopPropagation();
    navigate(`/play/${song.id}`, { state: { song } }); // 상태와 함께 네비게이션
  };

  const handlePreview = async (e, songId) => {
    e.stopPropagation();

    try {
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.load();
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_ENDPOINT}/songs/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songId }),
        }
      );

      if (!response.ok) {
        throw new Error("Preview request failed");
      }

      const audioBlob = await response.blob();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      audioRef.current.load();

      setTimeout(() => {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.error("Failed to play audio:", error);
            setIsPlaying(false);
          });
      }, 100);
    } catch (error) {
      console.error("Error playing preview:", error);
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    audioRef.current.currentTime = 0;
  };

  if (!selectedSong) {
    return (
      <div className="preview-placeholder">곡 선택 후 세부사항이 보입니다.</div>
    );
  }

  return (
    <div
      className={`${
        isMobile ? "preview-container-mobile" : "preview-container-desktop"
      }`}
    >
      <div className="preview-image-container">
        {selectedSong.image && selectedSong.image.data ? (
          <img
            src={`data:image/jpeg;base64,${arrayBufferToBase64(
              selectedSong.image.data
            )}`}
            alt={selectedSong.metadata.title}
          />
        ) : (
          <div className="no-image">이미지가 존재하지 않습니다.</div>
        )}
      </div>

      <div className="preview-info-container">
        <h3 className="preview-title">{selectedSong.metadata.title}</h3>
        <p className="preview-subtitle">{selectedSong.metadata.description}</p>
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnded}
          style={{ display: "none" }}
        />
        <div className="preview-buttons">
          <button
            className={`preview-play-button ${isPlaying ? "playing" : ""}`}
            onClick={(e) => handlePreview(e, selectedSong.id)}
            aria-label={isPlaying ? "Pause Preview" : "Play Preview"}
          >
            {isPlaying ? "Pause" : "Play Preview"}
          </button>
          <button
            className="preview-sing-button"
            onClick={(e) => handlePlay(e, selectedSong)}
            aria-label="Sing Song"
          >
            Sing
          </button>
        </div>
      </div>
    </div>
  );
}

export default Preview;
