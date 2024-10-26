import React, { useEffect, useRef } from 'react';

const AudioPlayer = ({
  isPlaying,
  setIsPlaying,
  userSeekPosition,
  audioBlob, // 수정된 부분: audioUrl 대신 audioBlob 사용
  setAudioLoaded,
  setDuration,
  onPlaybackPositionChange,
}) => {
  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);
  const sourceRef = useRef(null);
  const startTimeRef = useRef(0);
  const playbackPositionRef = useRef(0);
  const animationFrameIdRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadAudio = async () => {
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();

        if (!isMounted) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBufferRef.current = audioBuffer;

        setDuration(audioBuffer.duration);
        setAudioLoaded(true);
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    };

    if (audioBlob) {
      loadAudio();
    }

    return () => {
      isMounted = false;
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioBlob, setDuration, setAudioLoaded]);

  const playAudio = (offset) => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    const audioContext = audioContextRef.current;

    if (sourceRef.current) {
      sourceRef.current.stop();
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(audioContext.destination);
    sourceRef.current = source;

    startTimeRef.current = audioContext.currentTime - offset;

    source.start(0, offset);

    source.onended = () => {
      setIsPlaying(false);
      playbackPositionRef.current = 0;
      sourceRef.current = null;
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  };

  const pauseAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
      const audioContext = audioContextRef.current;
      const elapsedTime = audioContext.currentTime - startTimeRef.current;
      playbackPositionRef.current = elapsedTime;
    }
  };

  const updatePosition = () => {
    if (isPlaying && audioContextRef.current) {
      const audioContext = audioContextRef.current;
      const currentTime = audioContext.currentTime;
      const elapsedTime = currentTime - startTimeRef.current;
      playbackPositionRef.current = elapsedTime;

      if (playbackPositionRef.current >= audioBufferRef.current.duration) {
        setIsPlaying(false);
        playbackPositionRef.current = 0;
        sourceRef.current = null;
        cancelAnimationFrame(animationFrameIdRef.current);
        return;
      }

      // 재생 위치를 부모 컴포넌트에 전달
      if (onPlaybackPositionChange) {
        onPlaybackPositionChange(playbackPositionRef.current);
      }

      animationFrameIdRef.current = requestAnimationFrame(updatePosition);
    }
  };

  useEffect(() => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    const resumeAudioContext = async () => {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
    };

    if (isPlaying) {
      resumeAudioContext().then(() => {
        const offset = playbackPositionRef.current;
        playAudio(offset);
        animationFrameIdRef.current = requestAnimationFrame(updatePosition);
      });
    } else {
      pauseAudio();
      cancelAnimationFrame(animationFrameIdRef.current);
    }

    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
      cancelAnimationFrame(animationFrameIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // 사용자가 시크 바를 조작하여 재생 위치를 변경할 때 처리
  useEffect(() => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    // 내부 재생 위치 업데이트
    playbackPositionRef.current = userSeekPosition;

    if (isPlaying) {
      // 재생 중이면 현재 재생을 멈추고 새로운 위치에서 다시 재생
      pauseAudio();
      cancelAnimationFrame(animationFrameIdRef.current);

      // 재생 상태를 유지하지만 바로 재생은 하지 않음 (사용자가 재생 버튼을 눌러야 함)
      if (onPlaybackPositionChange) {
        onPlaybackPositionChange(playbackPositionRef.current);
      }

      // animationFrameId는 멈추고 나서 나중에 재생될 때 새로 업데이트되도록 함
    } else {
      // 재생 중이 아니면 다음 재생 시 새로운 위치에서 시작
      if (onPlaybackPositionChange) {
        onPlaybackPositionChange(playbackPositionRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSeekPosition]);

  return null; // UI 요소 없음
};

export default AudioPlayer;
