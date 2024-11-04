import { useState, useEffect, useRef } from 'react';
import { PitchDetector } from 'pitchy';
import { setupAudioContext, calculateRMS } from '../utils/AudioUtils';

export const usePitchDetection = (targetStream, isPlaying = true, isMicOn, playbackPositionRef, setEntireGraphData, connections = [], socketId) => {
  const [pitch, setPitch] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [decibel, setDecibel] = useState(-Infinity);

  const pitchHistoryRef = useRef([]);
  const MAX_HISTORY_LENGTH = 5;

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const detectorRef = useRef(null);
  const pitchRef = useRef(pitch);
  const isPlayingRef = useRef(isPlaying);

  // 피치 변화 감지를 위한 상태 추가
  const potentialPitchRef = useRef(null);
  const potentialPitchCountRef = useRef(0);
  const lastPitchTimeRef = useRef(0);

  // 멀티플레이 용
  const pitchCountRef = useRef(0);
  const pitchBufferRef = useRef([]);

  const PITCH_CONFIG = {
    MIN_VALID_PITCH: 50,
    MAX_VALID_PITCH: 1500,
    MIN_CLARITY: 0.5,
    MIN_DECIBEL: -35,
    MAX_PITCH_JUMP: 0.3,
    CONFIRMATION_THRESHOLD: 3,
    JUMP_TOLERANCE_TIME: 10,
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
    pitchCountRef.current += 1;

    // 4개의 피치 데이터가 모였을 때 전송
    if (pitchCountRef.current >= 4 && socketId) {
      const dataToSend = {
        type: 'pitch-data',
        pitches: pitchBufferRef.current,
        id: socketId,
      };

      // 모든 connection으로 데이터 전송
      Object.values(connections).forEach((channel) => {
        if (channel.readyState === 'open') {
          channel.send(JSON.stringify(dataToSend));
        }
      });

      // 버퍼 초기화
      pitchBufferRef.current = [];
      pitchCountRef.current = 0;
    }
  };
  useEffect(() => {
    pitchRef.current = pitch;
  }, [pitch]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const getMedianPitch = (pitches) => {
    const validPitches = pitches.filter((p) => p > 0);
    if (validPitches.length === 0) return 0;

    const sorted = [...validPitches].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  };

  const calculateMovingAverage = (newPitch) => {
    pitchHistoryRef.current.push(newPitch);
    if (pitchHistoryRef.current.length > MAX_HISTORY_LENGTH) {
      pitchHistoryRef.current.shift();
    }

    return getMedianPitch(pitchHistoryRef.current);
  };

  const validatePitchChange = (newPitch, currentPitch, currentTime) => {
    if (currentPitch === 0) return true;

    const octaveDiff = Math.abs(Math.log2(newPitch / currentPitch));
    const timeSinceLastUpdate = currentTime - lastPitchTimeRef.current;

    // 급격한 변화가 아닌 경우 바로 허용
    if (octaveDiff <= PITCH_CONFIG.MAX_PITCH_JUMP) {
      potentialPitchRef.current = null;
      potentialPitchCountRef.current = 0;
      return true;
    }

    // 이전과 동일한 급격한 변화가 감지된 경우
    if (potentialPitchRef.current !== null) {
      const potentialPitchDiff = Math.abs(Math.log2(newPitch / potentialPitchRef.current));

      // 새로운 피치가 이전에 감지된 potential pitch와 비슷한 경우
      if (potentialPitchDiff <= 0.1) {
        // 10% 이내의 변화는 같은 피치로 간주
        potentialPitchCountRef.current++;

        // 충분한 횟수동안 같은 피치가 감지되면 새로운 피치로 인정
        if (potentialPitchCountRef.current >= PITCH_CONFIG.CONFIRMATION_THRESHOLD) {
          potentialPitchRef.current = null;
          potentialPitchCountRef.current = 0;
          return true;
        }
      } else {
        // 다른 피치가 감지되면 카운터 리셋
        potentialPitchRef.current = newPitch;
        potentialPitchCountRef.current = 1;
      }
    } else {
      // 새로운 급격한 변화 감지 시작
      potentialPitchRef.current = newPitch;
      potentialPitchCountRef.current = 1;
    }

    // 일정 시간이 지나면 강제로 피치 업데이트 허용
    if (timeSinceLastUpdate > PITCH_CONFIG.JUMP_TOLERANCE_TIME) {
      potentialPitchRef.current = null;
      potentialPitchCountRef.current = 0;
      return true;
    }

    return false;
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

  useEffect(() => {
    let intervalId;

    function updatePitch() {
      if (!analyserRef.current || !detectorRef.current) return;

      const input = new Float32Array(analyserRef.current.fftSize);
      analyserRef.current.getFloatTimeDomainData(input);
      const rms = calculateRMS(input);
      const newDecibel = 20 * Math.log10(rms);
      setDecibel(newDecibel);

      const currentTime = Date.now();

      if (newDecibel > PITCH_CONFIG.MIN_DECIBEL) {
        const [pitchResult, clarityResult] = detectorRef.current.findPitch(input, audioContextRef.current.sampleRate);

        if (clarityResult > PITCH_CONFIG.MIN_CLARITY && pitchResult >= PITCH_CONFIG.MIN_VALID_PITCH && pitchResult <= PITCH_CONFIG.MAX_VALID_PITCH) {
          // 피치 변화 검증
          if (validatePitchChange(pitchResult, pitchRef.current, currentTime)) {
            const smoothedPitch = calculateMovingAverage(pitchResult);
            lastPitchTimeRef.current = currentTime;
            setPitch(smoothedPitch);
            setClarity(clarityResult);

            // Update entireGraphData based on playbackPosition
            const playbackPos = playbackPositionRef.current; // seconds
            const index = round(playbackPos * 40); // Assuming 25ms per data point: 1 sec = 40 data points

            setEntireGraphData((prevData) => {
              if (index < 0 || index >= prevData.length) return prevData;

              prevData[index] = smoothedPitch;
              return prevData;
            });
            if (Object.keys(connections).length > 0) {
              sendPitchData(smoothedPitch, index);
            }
          } else {
            // 검증되지 않은 피치는 그래프에 표시하되 현재 피치는 유지
            const playbackPos = playbackPositionRef.current;
            const index = round(playbackPos * 40);

            setEntireGraphData((prevData) => {
              if (index < 0 || index >= prevData.length) return prevData;

              prevData[index] = pitchRef.current > 0 ? pitchRef.current : null;
              return prevData;
            });
            if (Object.keys(connections).length > 0) {
              sendPitchData(pitchRef.current > 0 ? pitchRef.current : 0, index);
            }
          }
        } else {
          // 유효하지 않은 피치인 경우
          const playbackPos = playbackPositionRef.current;
          const index = round(playbackPos * 40);

          setEntireGraphData((prevData) => {
            if (index < 0 || index >= prevData.length) return prevData;

            prevData[index] = null;
            return prevData;
          });

          setPitch(0);
          if (Object.keys(connections).length > 0) {
            sendPitchData(0, index);
          }
        }
      } else {
        setPitch(0);
        const playbackPos = playbackPositionRef.current;
        const index = round(playbackPos * 40);

        setEntireGraphData((prevData) => {
          if (index < 0 || index >= prevData.length) return prevData;

          prevData[index] = null;
          return prevData;
        });
        if (Object.keys(connections).length > 0) {
          sendPitchData(0, index);
        }
      }
    }

    if (isPlaying && isMicOn) {
      intervalId = setInterval(updatePitch, 25);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, isMicOn, playbackPositionRef, setEntireGraphData]);

  return { pitch, clarity, decibel };
};
