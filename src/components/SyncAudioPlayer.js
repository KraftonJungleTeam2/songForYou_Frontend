import React, { useEffect, useRef } from 'react';

const AudioPlayer = ({
  isPlaying, // 재생 여부를 나타내는 bool 값, true면 재생 중, false면 일시정지 상태
  setIsPlaying, // 재생 상태를 제어하는 함수, 외부에서 재생/일시정지 상태를 변경할 수 있음
  audioBlob, // 오디오 데이터가 담긴 Blob 객체, 로컬이나 서버에서 가져온 파일 데이터
  setAudioLoaded, // 오디오가 로드된 상태를 설정하는 함수, 로드 완료 여부를 표시
  setDuration, // 오디오 길이를 설정하는 함수, 오디오 파일의 총 길이를 설정
  onPlaybackPositionChange, // 재생 위치가 변경될 때 호출되는 콜백 함수, 시크바 위치를 업데이트하는데 사용
  starttime,
  setStarttime,
  setIsWaiting,
  setIsMicOn,
  latencyOffset,
  playbackSpeed = 1, // 재생 속도를 제어하는 값, 기본 속도는 1배속이며 조절 가능
}) => {
  const audioContextRef = useRef(null); // AudioContext 객체를 참조, 오디오 처리 및 재생에 사용됨
  const audioBufferRef = useRef(null); // 오디오 데이터가 담긴 AudioBuffer를 참조, 로드된 오디오 데이터를 담고 있음
  const sourceRef = useRef(null); // AudioBufferSourceNode를 참조, 오디오 재생에 사용하는 소스 노드
  const resumeTimeRef = useRef(0); // 오디오 시작 시간을 저장, 일시정지 후 재생 시 기준 시간을 맞추기 위해 사용
  const playbackPositionRef = useRef(0); // 현재 재생 위치를 저장, 일시정지 및 재생 위치를 추적하는 데 사용
  const animationFrameRef = useRef(null); // requestAnimationFrame의 ID를 저장하여 애니메이션 업데이트 관리에 사용
  const rateTimeoutRef = useRef(null);
  const FRAME_RATE = 0.025; // 프레임 속도, 25ms 단위로 업데이트하여 일정한 타이밍으로 재생 위치를 업데이트
  const SPEEDFORWARD = 2.0;
  const SPEEDBACKWARD = 0.5;
  const TOLERANCE = 10; // ms단위로 허용 overrun을 설정

  // 현재 시간을 프레임 단위에 맞춰 반올림하는 함수
  const roundToFrame = (time) => {
    return Math.round(time / FRAME_RATE) * FRAME_RATE;
  };

  // 오디오 파일을 로드하고 AudioBuffer에 저장
  useEffect(() => {
    if (!audioBlob) return;
    const loadAudio = async () => {
      try {
        // Blob 데이터를 ArrayBuffer로 변환
        const arrayBuffer = await audioBlob.arrayBuffer();
        // 웹에서 오디오를 재생하기 위한 Context를 생성 (구버전 호환 포함)
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        // 오디오 데이터를 디코딩하여 AudioBuffer로 변환
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
        // 오디오 버퍼가 완전히 로드된 후 duration과 로드 상태 설정
        setDuration(audioBufferRef.current.duration);
        setAudioLoaded(true);
      } catch (error) {
        console.error('오디오 로딩 오류:', error);
      }
    };
    loadAudio();
    return () => {
      if (audioContextRef.current) audioContextRef.current.close(); // AudioContext를 닫아 자원을 해제
    };
  }, [audioBlob]);

  // 오디오 재생 함수
  const playSyncAudio = (starttime) => {
    const audioContext = audioContextRef.current;
    const audioBuffer = audioBufferRef.current;
    if (!audioBuffer || !audioContext) return;
    if (sourceRef.current) sourceRef.current.stop(); // 이전에 재생 중이던 소스를 중지

    // 새로운 소스 생성 및 연결
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = playbackSpeed; // 재생 속도 설정
    source.connect(audioContext.destination);
    sourceRef.current = source;

    // 시작 시간 설정 (오프셋을 반영하여 재생 위치 조정)
    const offset = (Date.now() - starttime) / 1000;
    // while (Date.now() < starttime) {}
    // source.start();

    //offset이 음수면 정상작동 > So 오디오context기준 몇초 current.time이 0초(취급)임
    if (offset < 0) {
      source.start(audioContext.currentTime - offset);
    } else {
      source.start(0, offset);
    }
    setIsPlaying(true);
    setIsWaiting(false);
    setTimeout(() => { setIsMicOn(false); }, -offset * 1000);
    resumeTimeRef.current = audioContext.currentTime - offset;

    // 재생 완료 시 호출되는 콜백 설정
    source.onended = () => {
      setIsPlaying(false); // 재생이 끝나면 일시정지 상태로 변경
      playbackPositionRef.current = 0; // 재생 위치를 초기화
      setStarttime(null);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  };

  // 재생속도를 설정 예: setPlaybackRate(1.1); -> 1.1배속으로 설정
  const setPlaybackRate = (rate) => {
    const audioContext = audioContextRef.current;
    const source = sourceRef.current;
    const prevRate = source.playbackRate.value;
    const timePassed = audioContext.currentTime - resumeTimeRef.current;
    
    playbackPositionRef.current += timePassed * prevRate;
    resumeTimeRef.current += timePassed;
    source.playbackRate.value = rate;
  }
  
  // 현재 재생시간을 초단위로 가져옴 예: getPlaybackTime() == 36.1 -> 현재 36.1초 플레이 중
  const getPlaybackTime = () => {
    const audioContext = audioContextRef.current;
    const source = sourceRef.current;
    if (!source) return 0; // 소스가 없으면 0 반환
    const prevRate = source.playbackRate.value;
    const timePassed = audioContext.currentTime - resumeTimeRef.current;

    return playbackPositionRef.current + timePassed * prevRate; // 초 단위
  }
  
  // 지연 시간에 따른 재생 속도 조절 (transition)
  useEffect(() => {
    if (!isPlaying) return;

    const targetTime = Date.now() - (starttime + latencyOffset);
    const overrun = getPlaybackTime() * 1000 - targetTime; // 실제보다 앞서나간 시간
    if (-TOLERANCE < overrun && overrun < TOLERANCE) return;

    const transitionSpeed = overrun < 0 ? SPEEDFORWARD : SPEEDBACKWARD;
    console.log("target: " + targetTime + " overrun:" + overrun);
    
    setPlaybackRate(transitionSpeed);
    clearTimeout(rateTimeoutRef.current);
    rateTimeoutRef.current = setTimeout(() => {
      console.log("default rate!, overrun: " + ((Date.now() - (starttime + latencyOffset)) - getPlaybackTime() * 1000));
      setPlaybackRate(1);
    }, overrun / (1 - transitionSpeed));
  }, [latencyOffset]);




  // 재생 및 일시정지 상태, 속도 변경 시 처리
  useEffect(() => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    if (starttime) {
      if (!isPlaying) {
        playSyncAudio(starttime); // 재생 위치와 속도로 재생
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [starttime]);


  
  // playback position 업데이트: isPlaying이 true일 때 25ms마다 호출
  useEffect(() => {
    if (!isPlaying) return;

    let lastUpdateTime = Date.now();

    const updatePosition = () => {
      if (!isPlaying) return;

      const now = Date.now();
      const elapsed = now - lastUpdateTime;

      if (elapsed >= FRAME_RATE * 1000) { // 25ms 이상 경과 시 업데이트
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

  // 컴포넌트 언마운트 시 자원 정리
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rateTimeoutRef.current) {
        clearTimeout(rateTimeoutRef.current);
      }
    };
  }, []);

  return null;
};

export default AudioPlayer;
