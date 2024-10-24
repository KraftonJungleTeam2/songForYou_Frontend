import React, { useEffect, useRef } from 'react';

const AudioPlayer = ({
  isPlaying,
  setIsPlaying,
  userSeekPosition,
  audioBlob,
  setAudioLoaded,
  setDuration,
  onPlaybackPositionChange,
}) => {
  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);
  const sourceRef = useRef(null);
  const startTimeRef = useRef(0);
  const playbackPositionRef = useRef(0);
  const animationFrameRef = useRef(null);
  const FRAME_RATE = 0.025; // 25ms in seconds

  const roundToFrame = (time) => {
    return Math.round(time / FRAME_RATE) * FRAME_RATE;
  };

  useEffect(() => {
    if (!audioBlob) return;

    const loadAudio = async () => {
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBufferRef.current = audioBuffer;

        setDuration(audioBuffer.duration);
        setAudioLoaded(true);
      } catch (error) {
        console.error('오디오 로딩 오류:', error);
      }
    };

    loadAudio();

    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [audioBlob, setDuration, setAudioLoaded]);

  const playAudio = (offset) => {
    const audioContext = audioContextRef.current;
    const audioBuffer = audioBufferRef.current;
    if (!audioBuffer || !audioContext) return;

    if (sourceRef.current) sourceRef.current.stop();

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    sourceRef.current = source;

    startTimeRef.current = audioContext.currentTime - offset;
    source.start(0, offset);

    source.onended = () => {
      setIsPlaying(false);
      playbackPositionRef.current = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  };

  const pauseAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      const audioContext = audioContextRef.current;
      playbackPositionRef.current = audioContext.currentTime - startTimeRef.current;
      sourceRef.current = null;
    }
  };

  const updatePosition = () => {
    const update = () => {
      const audioContext = audioContextRef.current;
      
      if (!audioContext || !isPlaying) return;

      const currentTime = audioContext.currentTime - startTimeRef.current;
      const roundedTime = roundToFrame(currentTime);
      playbackPositionRef.current = currentTime;

      if (playbackPositionRef.current >= audioBufferRef.current.duration) {
        setIsPlaying(false);
        playbackPositionRef.current = 0;
        return;
      }

      if (onPlaybackPositionChange) {
        onPlaybackPositionChange(roundedTime);
      }

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);
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
        playAudio(playbackPositionRef.current);
        updatePosition();
      });
    } else {
      pauseAudio();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    const roundedPosition = roundToFrame(userSeekPosition);
    playbackPositionRef.current = userSeekPosition;

    if (isPlaying) {
      pauseAudio();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    if (onPlaybackPositionChange) {
      onPlaybackPositionChange(roundedPosition);
    }
  }, [userSeekPosition]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return null;
};

export default AudioPlayer;