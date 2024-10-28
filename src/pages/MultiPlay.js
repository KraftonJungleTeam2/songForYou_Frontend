import { useEffect, useState, useRef } from "react";
import TopBar from "../components/TopBar";
import "../css/MultiPlay.css";
import AudioPlayer from "../components/AudioPlayer";
import audioFile from "../sample.mp3"; // 임시 MP3 파일 경로 가져오기

function MultiPlay() {
    const [players, setPlayers] = useState(Array(8).fill(null)); // 8자리 초기화
    const [isPlaying, setIsPlaying] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [isSocketOpen, setIsSocketOpen] = useState(false);
    const [userSeekPosition, setUserSeekPosition] = useState(0);
    const [audioLoaded, setAudioLoaded] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [playbackPosition, setPlaybackPosition] = useState(0);
    const [starttime, setStarttime] = useState(null);
    const startTimeoutRef = useRef(null);
    const socketRef = useRef(null); // 웹소켓 참조
    const pingTimes = useRef([]); // 지연 시간 측정을 위한 배열
    const animationFrameRef = useRef(null);
    const FRAME_RATE = 0.025;
    const playbackSpeed = 1;
    const avgStarttime = useRef(null);
    // 로컬 MP3 파일을 Blob으로 변환
    useEffect(() => {
        const loadAudioBlob = async () => {
            try {
                const response = await fetch(audioFile);
                const blob = await response.blob();
                setAudioBlob(blob);
            } catch (error) {
                console.error("오디오 파일 로드 실패:", error);
            }
        };

        loadAudioBlob();

        return () => {
            if (startTimeoutRef.current) {
                clearTimeout(startTimeoutRef.current);
            }

            if (socketRef.current) {
                socketRef.current.close(); // 컴포넌트가 언마운트될 때 소켓 닫기
            }
        };
    }, []);

    // 웹소켓 연결 및 지연 시간 계산
    useEffect(() => {
        socketRef.current = new WebSocket("wss://benmo.shop/ws");

        socketRef.current.onopen = () => {
            console.log("웹소켓 연결 성공");
            setIsSocketOpen(true);
        };

        socketRef.current.onmessage = (event) => {
            const receiveTime = Date.now();
            const data = JSON.parse(event.data);
            if (data.type === "pingResponse") {
                handlePingResponse(data.sendTime, data.untilStart, receiveTime);
            } else if (data.type === "startTime") {
                // setServerStartTime(data.startTime); // 서버 기준 시간 설정
                calculateDelay(); // 지연 시간 측정 시작
            }
        };

        socketRef.current.onerror = (error) => {
            console.error("웹소켓 오류:", error);
        };

        socketRef.current.onclose = () => {
            console.log("웹소켓 연결 종료");
            setIsSocketOpen(false);
        };
    }, []);

    // 초기 지연 시간 계산 함수
    const calculateDelay = () => {
        pingTimes.current = []; // 초기화
        sendPing(); // 첫 번째 ping 전송
    };

    // 지연 시간 측정을 위해 서버에 ping 메시지 전송
    const sendPing = () => {
        const sendTime = Date.now();
        socketRef.current.send(JSON.stringify({
            type: "ping",
            sendTime,
        }));
    };

    // 서버의 ping 응답을 처리하여 지연 시간 계산
    const handlePingResponse = (sendTime, untilStart, receiveTime) => {
        const roundTripTime = receiveTime - sendTime;
        const untilStartAdjusted = untilStart - (roundTripTime / 2);
        pingTimes.current.push(receiveTime + untilStartAdjusted);

        if (pingTimes.current.length >= 20) {
            pingTimes.current.sort();
            avgStarttime.current = pingTimes.current[10];
            console.log(pingTimes.current);
            setStarttime(avgStarttime.current); // 지연 시간을 초 단위로 설정
            handleStartPlayback(avgStarttime.current);
        } else {
            console.log(["RTT", roundTripTime])
            sendPing(); // 50번까지 반복하여 서버에 ping 요청
        }
    };

    // 서버에서 받은 시작 시간에 따라 클라이언트에서 재생 시작 시각을 조정
    const handleStartPlayback = (avgStartTime) => {
        const clientTime = Date.now();
        const timeUntilStart = avgStartTime - clientTime; // 지연 고려한 대기 시간 계산
        console.log(timeUntilStart);
        if (timeUntilStart > 0) {
            console.log(`Starting playback in ${timeUntilStart.toFixed(2)} seconds based on server time.`);
            // while (Date.now() - avgStartTime < 0) {}
            // console.log("START NOW@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
            setIsPlaying(true);
            setIsWaiting(false);
        } else {
            console.log("Server start time has already passed. Starting playback immediately.");
            setIsPlaying(true);
            setIsWaiting(false);
        }
    };

    // 시작 버튼 클릭 핸들러
    const handleStartClick = () => {
        setIsWaiting(true);
        if (!audioLoaded) {
            alert("오디오가 아직 로딩되지 않았습니다.");
            setIsWaiting(false);
            return;
        }

        // 서버에 시작 요청 보내기
        socketRef.current.send(JSON.stringify({ type: "requestStartTimeWithDelay" }));
    };

    // 재생 위치 변경 핸들러 (seek bar)
    const handlePlaybackPositionChange = (e) => {
        const newPosition = parseFloat(e.target.value);
        setUserSeekPosition(newPosition);
        setPlaybackPosition(newPosition);
    };

    // AudioPlayer에서 전달받은 재생 위치 업데이트 핸들러
    const handleAudioPlaybackPositionChange = (position) => {
        setPlaybackPosition(position);
    };







    const audioContextRef = useRef(null); // AudioContext 객체를 참조, 오디오 처리 및 재생에 사용됨
    const audioBufferRef = useRef(null); // 오디오 데이터가 담긴 AudioBuffer를 참조, 로드된 오디오 데이터를 담고 있음
    const sourceRef = useRef(null); // AudioBufferSourceNode를 참조, 오디오 재생에 사용하는 소스 노드
    const resumeTimeRef = useRef(0); // 오디오 시작 시간을 저장, 일시정지 후 재생 시 기준 시간을 맞추기 위해 사용
    const playbackPositionRef = useRef(0); // 현재 재생 위치를 저장, 일시정지 및 재생 위치를 추적하는 데 사용
    // const animationFrameRef = useRef(null); // requestAnimationFrame의 ID를 저장하여 애니메이션 업데이트 관리에 사용
    // const FRAME_RATE = 0.025; // 프레임 속도, 25ms 단위로 업데이트하여 일정한 타이밍으로 재생 위치를 업데이트
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
    const playAudio = (starttime = null, speed = 1) => {
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
      resumeTimeRef.current = audioContext.currentTime - 0 / speed;
      if (starttime != null) {
          while (Date.now() < starttime) {};
          console.log("started");
          source.start((Date.now()-starttime)/1000);
      } else {
        source.start();
      }
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
        if (handleAudioPlaybackPositionChange) {
          handleAudioPlaybackPositionChange(roundedTime);
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
          playAudio(avgStarttime.current, playbackSpeed); // 재생 위치와 속도로 재생
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
      if (handleAudioPlaybackPositionChange) {
        handleAudioPlaybackPositionChange(roundedPosition);
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




    return (
        <div className="multiPlay-page">
            <TopBar className="top-bar" />
            <div className="multi-content">
                <div className="players">
                    {players.map((player, index) => (
                        <div key={index} className="player-card">
                            {player ? (
                                <div>
                                    <p>{player.name}</p>
                                </div>
                            ) : (
                                <p>빈 자리</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* 오디오 상태 표시 */}
                <div className="audio-status">
                    {audioLoaded ? (
                        <div>
                            <p>오디오 로드 완료 - 길이: {duration.toFixed(2)}초</p>
                            <p>현재 상태: {isPlaying ? '재생 중' : '정지'}</p>
                            <p>재생 위치: {playbackPosition.toFixed(2)}초</p>
                            <p>실제 지연 시간: {starttime ? starttime.toFixed(5) : "측정 중"}초</p>
                        </div>
                    ) : (
                        <p>오디오 로딩 중...</p>
                    )}
                </div>

                {/* 시작 버튼 */}
                <button
                    onClick={handleStartClick}
                    disabled={!audioLoaded || isPlaying || isWaiting || !isSocketOpen}
                    className={`button start-button ${!audioLoaded || isWaiting || !isSocketOpen? 'is-loading' : ''}`}
                >
                    {audioLoaded ? "노래 시작" : "로딩 중..."}
                </button>

                {/* Seek Bar */}
                <div className="seek-bar-container">
                    <input
                        type="range"
                        min="0"
                        max={duration}
                        step="0.025"
                        value={playbackPosition}
                        onChange={handlePlaybackPositionChange}
                        className="range-slider"
                        disabled={!audioLoaded}
                    />
                    <div className="playback-info">
                        {playbackPosition.toFixed(2)} / {duration.toFixed(2)} 초
                    </div>
                </div>

                {/* AudioPlayer 컴포넌트 */}
                {/* <audio
                ref={audioRef}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                style={{ display: 'none' }}
                /> */}
            </div>
        </div>
    );
}

export default MultiPlay;
