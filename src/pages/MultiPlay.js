import { useEffect, useState, useRef } from "react";
import TopBar from "../components/TopBar";
import "../css/MultiPlay.css";
import AudioPlayer from "../components/SyncAudioPlayer";
import audioFile from "../sample.mp3"; // 임시 MP3 파일 경로 가져오기
import PitchGraph from "../components/PitchGraph";
import io from 'socket.io-client'; // 시그널링 용 웹소켓 io라고함
function MultiPlay() {
    const [players, setPlayers] = useState(Array(4).fill(null)); // 8자리 초기화
    const [isPlaying, setIsPlaying] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [isSocketOpen, setIsSocketOpen] = useState(false);
    const [userSeekPosition, setUserSeekPosition] = useState(0);
    const [audioLoaded, setAudioLoaded] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [playbackPosition, setPlaybackPosition] = useState(0);
    const [starttime, setStarttime] = useState(null);
    const [isMicOn, setIsMicOn] = useState(false);
    
    //웹소켓 부분
    const socketRef = useRef(null); // 웹소켓 참조
    const pingTimes = useRef([]); // 지연 시간 측정을 위한 배열
    const peerConnections = {}; // 개별 연결을 저장한 배열 생성

    //화면 조정을 위한 state들
    const [dimensions, setDimensions] = useState({ width: 0, height: 600 });
    const containerRef = useRef(null);


    // 서버에서 데이터 로딩 후 배열 생성
    const [entireGraphData, setEntireGraphData] = useState([]);
    const [entireReferData, setEntireReferData] = useState([]);

    const [dataPointCount, setDataPointCount] = useState(200);
    const [playbackSpeed, setPlaybackSpeed] = useState(1); // 속도 제어 상태 추가

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
            if (socketRef.current) {
                socketRef.current.close(); // 컴포넌트가 언마운트될 때 소켓 닫기
            }
        };
    }, []);

    // 웹소켓 연결 및 지연 시간 계산
    useEffect(() => {
        socketRef.current = new WebSocket("ws://localhost:5000/ws");

        socketRef.current.onopen = () => {
            console.log("웹소켓 연결 성공");
            setIsSocketOpen(true);
        };

        socketRef.current.onmessage = (event) => {
            const receiveTime = Date.now();
            const data = JSON.parse(event.data);
            if (data.type === "pingResponse") {
                handlePingResponse(data.sendTime, data.untilStart, receiveTime);
            } 
            else if (data.type === "startTime") {
                // setServerStartTime(data.startTime); // 서버 기준 시간 설정
                calculateDelay(); // 지연 시간 측정 시작
            }
            else if (data.type === "Players"){

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

    // 화면 비율 조정 감지
    useEffect(() => {
        function handleResize() {
          if (containerRef.current) {
            setDimensions({
              width: containerRef.current.offsetWidth,
              height: 500,
            });
          }
        }
    
        handleResize();
        window.addEventListener('resize', handleResize);
    
        return () => window.removeEventListener('resize', handleResize);
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
            const avgStartTime = pingTimes.current[10];
            setStarttime(avgStartTime);
        } else {
            sendPing(); // 50번까지 반복하여 서버에 ping 요청
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

    const getLocalStream = async () => {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } catch (error) {
          console.error('마이크 스트림 오류:', error);
        }
      };
    
    return (
        <div className="multiPlay-page">
            <TopBar className="top-bar" />
            <div className="multi-content">
                <div className="players-chat">
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

                    <div className="chat-area">
                        <p>chating area</p>
                    </div>
                </div>
                
                <div className="sing-area" ref={containerRef}>
                    <div className="information-area">
                        <p>현재곡</p>
                        <p>가수</p>
                        <p>곡번호</p>
                    </div>
                    {/* 오디오 상태 표시 */}
                    {/* <div className="audio-status">
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
                    </div> */}

                    <div className="pitch-graph-multi" style={{ height: "500px" }}>
                        <PitchGraph
                        dimensions={dimensions}
                        realtimeData={entireGraphData}
                        referenceData={entireReferData}
                        dataPointCount={dataPointCount}
                        currentTimeIndex={playbackPosition * 40}
                        // songState={song}
                        />
                    </div>

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
                            {playbackPosition.toFixed(3)} / {duration.toFixed(2)} 초
                        </div>
                    </div>
                    {/* 시작 버튼 */}
                      <button
                          onClick={handleStartClick}
                          disabled={!audioLoaded || isPlaying || isWaiting || !isSocketOpen}
                          className={`button start-button ${!audioLoaded || isWaiting || !isSocketOpen? 'is-loading' : ''}`}
                      >
                          {audioLoaded ? "노래 시작" : "로딩 중..."}
                      </button>
                      <button className="button"
                        onClick={() => {
                          setStarttime(isMicOn ? starttime+200 : starttime-200);
                          setIsMicOn(!isMicOn);}}
                        > {isMicOn?'마이크 끄기':'마이크 켜기'}
                        </button>
                    {/* AudioPlayer 컴포넌트 */}
                    <AudioPlayer
                        isPlaying={isPlaying}
                        setIsPlaying={setIsPlaying}
                        userSeekPosition={userSeekPosition}
                        audioBlob={audioBlob}
                        setAudioLoaded={setAudioLoaded}
                        setDuration={setDuration}
                        onPlaybackPositionChange={handleAudioPlaybackPositionChange}
                        starttime={starttime}
                        setStarttime={setStarttime}
                        setIsWaiting={setIsWaiting}
                    />

                </div>

            </div>
        </div>
    );
}

export default MultiPlay;
