import React, { useEffect, useRef } from 'react';
const AudioPlayer = ({
  isPlaying, // 재생 여부를 나타내는 bool 값, true면 재생 중, false면 일시정지 상태
  setIsPlaying, // 재생 상태를 제어하는 함수, 외부에서 재생/일시정지 상태를 변경할 수 있음
  userSeekPosition, // 시크바 위치를 나타내는 값, 사용자가 원하는 재생 위치로 이동할 때 사용
  audioBlob, // 오디오 데이터가 담긴 Blob 객체, 로컬이나 서버에서 가져온 파일 데이터
  setAudioLoaded, // 오디오가 로드된 상태를 설정하는 함수, 로드 완료 여부를 표시
  setDuration, // 오디오 길이를 설정하는 함수, 오디오 파일의 총 길이를 설정
  onPlaybackPositionChange, // 재생 위치가 변경될 때 호출되는 콜백 함수, 시크바 위치를 업데이트하는데 사용
  starttime,
  playbackSpeed = 1, // 재생 속도를 제어하는 값, 기본 속도는 1배속이며 조절 가능
}) => {
  const audioContextRef = useRef(null); // AudioContext 객체를 참조, 오디오 처리 및 재생에 사용됨
  const audioBufferRef = useRef(null); // 오디오 데이터가 담긴 AudioBuffer를 참조, 로드된 오디오 데이터를 담고 있음
  const sourceRef = useRef(null); // AudioBufferSourceNode를 참조, 오디오 재생에 사용하는 소스 노드
  const resumeTimeRef = useRef(0); // 오디오 시작 시간을 저장, 일시정지 후 재생 시 기준 시간을 맞추기 위해 사용
  const playbackPositionRef = useRef(0); // 현재 재생 위치를 저장, 일시정지 및 재생 위치를 추적하는 데 사용
  const animationFrameRef = useRef(null); // requestAnimationFrame의 ID를 저장하여 애니메이션 업데이트 관리에 사용
  const FRAME_RATE = 0.025; // 프레임 속도, 25ms 단위로 업데이트하여 일정한 타이밍으로 재생 위치를 업데이트
  // 현재 시간을 프레임 단위에 맞춰 반올림하는 함수
  const roundToFrame = (time) => {
    return Math.round(time / FRAME_RATE) * FRAME_RATE;
  };
  // 오디오 파일을 로드하고 AudioBuffer에 저장
  useEffect(() => {
    if (!audioBlob) return;
    const loadAudio = async () => {
      try {
        // @Ref는 렌더링에 관계없이 작동해야하는 부분이 있을 때 사용하는 hook
        // Blob 데이터를 ArrayBuffer로 변환
        const arrayBuffer = await audioBlob.arrayBuffer();
        // 웹에서 오디오를 재생하기 위한 Context를 생성 ||은 구버전일 때 호환되도록 한 것
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        // 오디오 데이터를 디코딩하여 AudioBuffer로 변환
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
        // 오디오 버퍼가 완전히 로드된 후에만 duration과 로드 상태 설정
        setDuration(audioBufferRef.current.duration);
        // 부모에서 표시할 오디오 로드 완료 상태로 변경
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
  const playAudio = (offset, speed = 1) => {
    const audioContext = audioContextRef.current;
    const audioBuffer = audioBufferRef.current;
    if (!audioBuffer || !audioContext) return;
    if (sourceRef.current) sourceRef.current.stop(); // 이전에 재생 중이던 소스를 중지
    // 새로운 소스 생성 및 연결
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    sourceRef.current = source;
    // 재생 속도 설정
    source.playbackRate.value = speed;
    // 시작 시간 설정 (오프셋을 반영하여 재생 위치 조정)
    resumeTimeRef.current = audioContext.currentTime - offset / speed;
    source.start(0, offset);
    // 재생 완료 시 호출되는 콜백 설정
    source.onended = () => {
      setIsPlaying(false); // 재생이 끝나면 일시정지 상태로 변경
      playbackPositionRef.current = 0; // 재생 위치를 초기화
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  };
  const playSyncAudio = (starttime) => {
    const audioContext = audioContextRef.current;
    const audioBuffer = audioBufferRef.current;
    if (!audioBuffer || !audioContext) return;
    if (sourceRef.current) sourceRef.current.stop(); // 이전에 재생 중이던 소스를 중지
    // 새로운 소스 생성 및 연결
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    sourceRef.current = source;
    // 시작 시간 설정 (오프셋을 반영하여 재생 위치 조정)
    while (Date.now() < starttime) {};
    const offset = Date.now()-starttime;
    source.start(0, offset/1000);
    resumeTimeRef.current = audioContext.currentTime;
    // 재생 완료 시 호출되는 콜백 설정
    source.onended = () => {
      setIsPlaying(false); // 재생이 끝나면 일시정지 상태로 변경
      playbackPositionRef.current = 0; // 재생 위치를 초기화
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  };
  // 오디오 일시정지 함수
  const pauseAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.stop(); // 현재 재생 중인 소스 중지
      const audioContext = audioContextRef.current;
      // 현재 재생 위치 저장 (재생 속도 반영)
      playbackPositionRef.current =
        (audioContext.currentTime - resumeTimeRef.current) * sourceRef.current.playbackRate.value;
      sourceRef.current = null; // 소스 초기화
    }
  };
  // 재생 위치를 주기적으로 업데이트하는 함수
  const updatePosition = () => {
    const update = () => {
      const audioContext = audioContextRef.current;
      if (!audioContext || !isPlaying) return;
      // 현재 재생 위치 계산 (속도 반영)
      const currentTime = (audioContext.currentTime - resumeTimeRef.current) * playbackSpeed;
      const roundedTime = roundToFrame(currentTime);
      playbackPositionRef.current = currentTime;
      // 재생이 오디오 길이를 초과하면 재생 위치 초기화
      if (playbackPositionRef.current >= audioBufferRef.current.duration) {
        playbackPositionRef.current = 0;
        return;
      }
      // 외부에서 재생 위치를 추적하도록 콜백 호출
      if (onPlaybackPositionChange) {
        onPlaybackPositionChange(roundedTime);
      }
      animationFrameRef.current = requestAnimationFrame(update); // 다음 프레임에서 다시 호출
    };
    animationFrameRef.current = requestAnimationFrame(update);
  };
  // 재생 및 일시정지 상태, 속도 변경 시 처리
  useEffect(() => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    const resumeAudioContext = async () => {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume(); // AudioContext가 멈춘 상태면 다시 시작
      }
    };
    if (isPlaying) {
      resumeAudioContext().then(() => {
        playSyncAudio(starttime); // 재생 위치와 속도로 재생
        updatePosition();
      });
    } else {
      pauseAudio();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current); // 애니메이션 업데이트 중지
      }
    }
    return () => {
      if (sourceRef.current) {
        // sourceRef.current.stop();
        // sourceRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed]);
  // 사용자가 시크 바를 조작하여 재생 위치를 변경할 때 처리
  useEffect(() => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    const roundedPosition = roundToFrame(userSeekPosition); // 시크 위치를 프레임 단위로 반올림
    playbackPositionRef.current = userSeekPosition;
    if (isPlaying) {
      playAudio(playbackPositionRef.current, playbackSpeed); // 변경된 위치에서 재생 시작
      updatePosition();
    }
    // 재생 중이 아니면 위치만 업데이트
    if (onPlaybackPositionChange) {
      onPlaybackPositionChange(roundedPosition);
    }
  }, [userSeekPosition]);
  // 컴포넌트 언마운트 시 자원 정리
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