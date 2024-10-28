import React, { useEffect, useRef } from 'react';

const AudioPlayer = ({
  isPlaying,
  setIsPlaying,
  userSeekPosition,
  audioBlob,
  setAudioLoaded,
  setDuration,
  onPlaybackPositionChange,
  playbackSpeed = 1,
}) => {
  const audioRef = useRef(null);
  const animationFrameRef = useRef(null);
  const FRAME_RATE = 0.025;

  // 현재 시간을 프레임 단위에 맞춰 반올림하는 함수
  const roundToFrame = (time) => {
    return Math.round(time / FRAME_RATE) * FRAME_RATE;
  };

  // 오디오 메타데이터가 로드되었을 때 실행되는 핸들러
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setAudioLoaded(true);
    }
  };

  // 오디오가 끝났을 때 실행되는 핸들러
  const handleEnded = () => {
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // 재생 위치를 주기적으로 업데이트하는 함수
  const updatePosition = () => {
    const update = () => {
      if (!audioRef.current || !isPlaying) return;

      const currentTime = audioRef.current.currentTime;
      const roundedTime = roundToFrame(currentTime);

      if (onPlaybackPositionChange) {
        onPlaybackPositionChange(roundedTime);
      }

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);
  };

  // audioBlob이 변경될 때 audio 요소의 src 설정
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob]);

  // 재생/일시정지 상태 변경 처리
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play();
      updatePosition();
    } else {
      audioRef.current.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isPlaying]);

  // 재생 속도 변경 처리
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // 시크 위치 변경 처리
  useEffect(() => {
    if (audioRef.current && userSeekPosition !== undefined) {
      audioRef.current.currentTime = userSeekPosition;
      const roundedPosition = roundToFrame(userSeekPosition);
      if (onPlaybackPositionChange) {
        onPlaybackPositionChange(roundedPosition);
      }
    }
  }, [userSeekPosition]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      style={{ display: 'none' }}
    />
  );
};

export default AudioPlayer;