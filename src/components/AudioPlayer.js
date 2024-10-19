import React, { useState, useEffect, useRef } from 'react';

const AudioPlayer = ({ isPlaying, audioUrl }) => {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);

  // 오디오 데이터를 받아오는 함수
  const fetchAudioData = async () => {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      setAudioBuffer(audioBuffer);
    } catch (error) {
      console.error('Error fetching audio data:', error);
    }
  };

  // 사용자가 재생을 클릭한 후에 AudioContext를 생성
  useEffect(() => {
    if (isPlaying && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      fetchAudioData();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isPlaying]);

  // isPlaying 상태에 따라 오디오 재생 또는 일시정지
  useEffect(() => {
    if (isPlaying && audioBuffer && audioContextRef.current) {
      const sourceNode = audioContextRef.current.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(audioContextRef.current.destination);
      sourceNode.start();
      sourceNodeRef.current = sourceNode;
    } else if (!isPlaying && sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
  }, [isPlaying, audioBuffer]);

  return null; // UI 요소를 반환하지 않고 오디오만 재생
};

export default AudioPlayer;
