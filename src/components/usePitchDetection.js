import { useEffect, useRef } from 'react';
import { PitchDetector } from 'pitchy';
import { setupAudioContext, calculateRMS } from '../utils/AudioUtils';

export const usePitchDetection = (isPlaying = true) => {
  const pitchRef = useRef(0);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const detectorRef = useRef(null);

  // 피치 변화 감지를 위한 상태 추가
  const potentialPitchRef = useRef(null);
  const potentialPitchCountRef = useRef(0);
  const lastPitchTimeRef = useRef(0);
  
  const PITCH_CONFIG = {
    MIN_VALID_PITCH: 50,
    MAX_VALID_PITCH: 1500,
    MIN_CLARITY: 0.5,
    MIN_DECIBEL: -35,
    MAX_PITCH_JUMP: 0.3,
    CONFIRMATION_THRESHOLD: 3,
    JUMP_TOLERANCE_TIME: 10,
  };
  
  const pitchHistoryRef = useRef([]);
  const MAX_HISTORY_LENGTH = 5;

  const getMedianPitch = (pitches) => {
    const validPitches = pitches.filter(p => p > 0);
    if (validPitches.length === 0) return 0;
    
    const sorted = [...validPitches].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
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
      if (potentialPitchDiff <= 0.1) {  // 10% 이내의 변화는 같은 피치로 간주
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
    async function setupAudio() {
      try {
        const { audioContext, analyser, source } = await setupAudioContext();
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        analyserRef.current.fftSize = 2 ** 13;
        analyserRef.current.smoothingTimeConstant = 0.8;
        sourceRef.current = source;

        const bufferLength = analyserRef.current.fftSize;
        detectorRef.current = PitchDetector.forFloat32Array(bufferLength);
      } catch (error) {
        console.error('마이크 접근 오류', error);
      }
    }

    setupAudio();

    return () => {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    let intervalId;

    function updatePitch() {
      if (!analyserRef.current || !detectorRef.current) return;

      const input = new Float32Array(analyserRef.current.fftSize);
      analyserRef.current.getFloatTimeDomainData(input);
      const rms = calculateRMS(input);
      const newDecibel = 20 * Math.log10(rms);
      
      const currentTime = Date.now();

      if (newDecibel > PITCH_CONFIG.MIN_DECIBEL) {
        const [pitchResult, clarityResult] = detectorRef.current.findPitch(
          input,
          audioContextRef.current.sampleRate
        );

        if (
          clarityResult > PITCH_CONFIG.MIN_CLARITY && 
          pitchResult >= PITCH_CONFIG.MIN_VALID_PITCH && 
          pitchResult <= PITCH_CONFIG.MAX_VALID_PITCH
        ) {
          // 피치 변화 검증
          if (validatePitchChange(pitchResult, pitchRef.current, currentTime)) {
            const smoothedPitch = calculateMovingAverage(pitchResult);
            lastPitchTimeRef.current = currentTime;
            pitchRef.current = smoothedPitch;
          }
          // 검증되지 않은 피치는 무시하고 현재 피치 유지
        } else {
          // 유효하지 않은 피치인 경우 피치를 0으로 설정
          pitchRef.current = 0;
        }
      } else {
        pitchRef.current = 0;
      }
    }

    if (isPlaying) {
      intervalId = setInterval(updatePitch, 25);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying]);

  // 현재 피치 값을 반환하는 함수
  const getPitch = () => pitchRef.current;

  return getPitch;
};
