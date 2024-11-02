import React, { useEffect, useRef } from 'react';
import { SoundTouch, SimpleFilter } from 'soundtouchjs';

const AudioPlayer = ({
  isPlaying,
  setIsPlaying,
  audioBlob,
  setAudioLoaded,
  setDuration,
  onPlaybackPositionChange,
  starttime,
  setStarttime,
  setIsWaiting,
  setIsMicOn,
  latencyOffset,
  musicGain,
  playbackSpeed = 1,
}) => {
  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);
  const sourceRef = useRef(null);
  const resumeTimeRef = useRef(0);
  const playbackPositionRef = useRef(0);
  const animationFrameRef = useRef(null);
  const rateTimeoutRef = useRef(null);
  const gainControlRef = useRef(null);
  const soundTouchRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const FRAME_RATE = 0.025;
  const SPEEDFORWARD = 2.0;
  const SPEEDBACKWARD = 0.5;
  const TOLERANCE = 20;
  const BUFFER_SIZE = 4096;
  
  const roundToFrame = (time) => {
    return Math.round(time / FRAME_RATE) * FRAME_RATE;
  };

  // SoundTouch 초기화 및 설정
  const initializeSoundTouch = (audioBuffer) => {
    const soundtouch = new SoundTouch();
    
    // 오디오 채널 데이터를 가져옴
    const channels = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    // SimpleFilter를 위한 소스 객체 생성
    const source = {
      extract: (target, numFrames, position) => {
        const l = Math.min(numFrames, audioBuffer.length - position);
        for (let i = 0; i < l; i++) {
          for (let c = 0; c < channels.length; c++) {
            target[i * channels.length + c] = channels[c][i + position];
          }
        }
        return l;
      },
      sourcePosition: 0,
      nChannels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate
    };

    const filter = new SimpleFilter(source, soundtouch);
    soundTouchRef.current = { soundtouch, filter };
    return { soundtouch, filter };
  };

  useEffect(() => {
    if (!audioBlob) return;
    const loadAudio = async () => {
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
        setDuration(audioBufferRef.current.duration);
        setAudioLoaded(true);
      } catch (error) {
        console.error('오디오 로딩 오류:', error);
      }
    };
    loadAudio();
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [audioBlob]);

  const handleStopAudio = () => {
    playbackPositionRef.current = 0;
    setStarttime(null);
    setAudioLoaded(false);
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
    }
  };

  const playSyncAudio = (starttime) => {
    const audioContext = audioContextRef.current;
    const audioBuffer = audioBufferRef.current;
    if (!audioBuffer || !audioContext) return;
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
      }
    }

    // SoundTouch 초기화
    const { soundtouch, filter } = initializeSoundTouch(audioBuffer);
    gainControlRef.current = audioContext.createGain();
    gainControlRef.current.gain.value = musicGain;

    // ScriptProcessor 노드 생성
    const scriptProcessor = audioContext.createScriptProcessor(BUFFER_SIZE, audioBuffer.numberOfChannels, audioBuffer.numberOfChannels);
    scriptProcessorRef.current = scriptProcessor;

    let offset = (performance.now() - starttime) / 1000;
    let position = 0;

    scriptProcessor.onaudioprocess = (e) => {
      const outputL = e.outputBuffer.getChannelData(0);
      const outputR = audioBuffer.numberOfChannels > 1 ? e.outputBuffer.getChannelData(1) : null;
      
      // 임시 버퍼 생성
      const tempBuffer = new Float32Array(BUFFER_SIZE * audioBuffer.numberOfChannels);
      const framesExtracted = filter.extract(tempBuffer, BUFFER_SIZE);
      
      if (framesExtracted === 0) {
        handleStopAudio();
        return;
      }

      // 채널 분리 및 출력
      for (let i = 0; i < BUFFER_SIZE; i++) {
        outputL[i] = tempBuffer[i * audioBuffer.numberOfChannels];
        if (outputR) {
          outputR[i] = tempBuffer[i * audioBuffer.numberOfChannels + 1];
        }
      }
    };

    scriptProcessor.connect(gainControlRef.current);
    gainControlRef.current.connect(audioContext.destination);

    setIsPlaying(true);
    setIsWaiting(false);
    resumeTimeRef.current = audioContext.currentTime - offset;
  };

  const setPlaybackRate = (rate) => {
    if (!soundTouchRef.current) return;
    
    const audioContext = audioContextRef.current;
    const timePassed = audioContext.currentTime - resumeTimeRef.current;
    const prevRate = soundTouchRef.current.soundtouch.tempo;
    
    playbackPositionRef.current += timePassed * prevRate;
    resumeTimeRef.current += timePassed;
    
    // SoundTouch의 tempo를 조절하여 음정을 유지하면서 속도만 변경
    soundTouchRef.current.soundtouch.tempo = rate;
  };

  const getPlaybackTime = () => {
    const audioContext = audioContextRef.current;
    if (!soundTouchRef.current || !audioContext) return 0;
    
    const timePassed = audioContext.currentTime - resumeTimeRef.current;
    const currentRate = soundTouchRef.current.soundtouch.tempo;
    
    return playbackPositionRef.current + timePassed * currentRate;
  };

  useEffect(() => {
    if (!isPlaying) return;

    const targetTime = performance.now() - (starttime + latencyOffset);
    const overrun = getPlaybackTime() * 1000 - targetTime;
    if (-TOLERANCE < overrun && overrun < TOLERANCE) return;

    const transitionSpeed = overrun < 0 ? SPEEDFORWARD : SPEEDBACKWARD;
    console.log('target: ' + targetTime + ' overrun:' + overrun);

    setPlaybackRate(transitionSpeed);

    clearTimeout(rateTimeoutRef.current);
    rateTimeoutRef.current = setTimeout(() => {
      console.log('default rate!, overrun: ' + (performance.now() - (starttime + latencyOffset) - getPlaybackTime() * 1000));
      setPlaybackRate(1);
    }, overrun / (1 - transitionSpeed));
  }, [latencyOffset]);

  useEffect(() => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    if (starttime) {
      if (!isPlaying) {
        playSyncAudio(starttime);
      }
    } else if (sourceRef.current) {
      handleStopAudio();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [starttime]);

  useEffect(() => {
    if (!isPlaying) return;

    let lastUpdateTime = performance.now();

    const updatePosition = () => {
      if (!isPlaying) return;

      const now = performance.now();
      const elapsed = now - lastUpdateTime;

      if (elapsed >= FRAME_RATE * 1000) {
        const currentTime = getPlaybackTime();
        const roundedTime = roundToFrame(currentTime);
        if (onPlaybackPositionChange) {
          onPlaybackPositionChange(roundedTime);
        }
        lastUpdateTime = now;
      }

      animationFrameRef.current = requestAnimationFrame(updatePosition);
    };

    animationFrameRef.current = requestAnimationFrame(updatePosition);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, latencyOffset]);

  useEffect(() => {
    if (gainControlRef.current) {
      gainControlRef.current.gain.value = musicGain;
    }
  }, [musicGain]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rateTimeoutRef.current) {
        clearTimeout(rateTimeoutRef.current);
      }
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
      }
    };
  }, []);

  return null;
};

export default AudioPlayer;