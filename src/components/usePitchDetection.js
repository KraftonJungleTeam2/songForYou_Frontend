import { useState, useEffect, useRef } from 'react';
import { PitchDetector } from 'pitchy';
import { setupAudioContext, calculateRMS } from '../utils/AudioUtils';

export const usePitchDetection = (targetStream, isPlaying = true, isMicOn, playbackPositionRef, setEntireGraphData, entireReferData, connections = [], socketId) => {

  const pitchHistoryRef = useRef([]);
  const MAX_HISTORY_LENGTH = 5;

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const detectorRef = useRef(null);
  const pitchRef = useRef(0);

  // 멀티플레이 용
  const pitchCountRef = useRef(0);
  const pitchBufferRef = useRef([]);
  const pitchSumRef = useRef(0);

  const PITCH_CONFIG = {
    MIN_VALID_PITCH: 65,
    MAX_VALID_PITCH: 1500,
    MIN_CLARITY: 0.4,
    MIN_CLARITY_INTERLUDE: 0.8,
    MIN_DECIBEL: -60,
  };

  const lastIndex = useRef(0);
  const round = (i) => {
    const idx = Math.floor(i);
    if (idx == lastIndex.current) {
      lastIndex.current = idx + 1;
      return idx + 1;
    } else {
      lastIndex.current = idx;
      return idx;
    }
  };
  // WebRTC를 통한 데이터 전송 함수
  const sendPitchData = (pitchData, index) => {
    pitchBufferRef.current.push({ pitch: pitchData, index });
    pitchSumRef.current += pitchData;
    pitchCountRef.current += 1;

    // 4개의 피치 데이터가 모였을 때 전송
    if (pitchCountRef.current >= 4 && socketId) {
      if (pitchSumRef.current > 0) {
        const dataToSend = {
          type: 'pitch-data',
          pitches: pitchBufferRef.current,
          id: socketId,
          score: Math.floor(Math.random()*100),
        };

        // 모든 connection으로 데이터 전송
        Object.values(connections).forEach((channel) => {
          if (channel.readyState === 'open') {
            channel.send(JSON.stringify(dataToSend));
          }
        });
      }
      // 버퍼 초기화
      pitchBufferRef.current = [];
      pitchCountRef.current = 0;
    }
  };

  const getMedianPitch = (pitches) => {
    const validPitches = pitches.filter((p) => p > 0);
    if (validPitches.length === 0) return 0;

    const sorted = [...validPitches].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  };

  const getMedian = (newPitch) => {
    pitchHistoryRef.current.push(newPitch);
    if (pitchHistoryRef.current.length > MAX_HISTORY_LENGTH) {
      pitchHistoryRef.current = pitchHistoryRef.current.slice(-MAX_HISTORY_LENGTH);
    }

    return getMedianPitch(pitchHistoryRef.current);
  };

  useEffect(() => {
    let stopStreamFunction;
    async function setupAudio() {
      try {
        const { audioContext, analyser, source, stopStream, stream } = await setupAudioContext(targetStream);
        stopStreamFunction = stopStream;
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        analyserRef.current.fftSize = 2 ** 13;
        analyserRef.current.smoothingTimeConstant = 0.8;
        sourceRef.current = source;

        const bufferLength = analyserRef.current.fftSize;
        detectorRef.current = PitchDetector.forFloat32Array(bufferLength);
      } catch (error) {
        console.error('Error accessing the microphone', error);
      }
    }
    if (targetStream) setupAudio();

    return () => {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (stopStreamFunction) {
        // 저장된 함수가 있을 때만 실행
        stopStreamFunction();
      }
    };
  }, [targetStream]);

  function updatePitch() {
    if (!analyserRef.current || !detectorRef.current) return;

    const input = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(input);
    const rms = calculateRMS(input);
    const decibel = 20 * Math.log10(rms);
    let smoothedPitch = 0

    // Update entireGraphData based on playbackPosition
    const playbackPos = playbackPositionRef.current; // seconds
    const index = round(playbackPos * 40); // Assuming 25ms per data point: 1 sec = 40 data points

    const [pitch, clarity] = detectorRef.current.findPitch(input, audioContextRef.current.sampleRate);

    if (decibel > PITCH_CONFIG.MIN_DECIBEL &&
      (entireReferData[index] > 0 ? clarity > PITCH_CONFIG.MIN_CLARITY : clarity > PITCH_CONFIG.MIN_CLARITY_INTERLUDE) &&
      pitch >= PITCH_CONFIG.MIN_VALID_PITCH && 
      pitch <= PITCH_CONFIG.MAX_VALID_PITCH) {
      smoothedPitch = getMedian(pitch);
    } else {
      pitchHistoryRef.current.push(0);
    }
    
    pitchRef.current = smoothedPitch;
    setEntireGraphData((prevData) => {
      if (index < 0 || index >= prevData.length) return prevData;

      prevData[index] = smoothedPitch ? smoothedPitch : null;
      return prevData;
    });
    if (Object.keys(connections).length > 0) {
      sendPitchData(smoothedPitch, index);
    }
  }

  useEffect(() => {
    let intervalId;

    if (isPlaying && isMicOn) {
      intervalId = setInterval(updatePitch, 25);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, isMicOn]);

  return;
};
