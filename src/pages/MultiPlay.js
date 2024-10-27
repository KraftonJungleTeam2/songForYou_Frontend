import { useEffect, useState, useRef } from "react";
import TopBar from "../components/TopBar";
import "../css/MultiPlay.css";
import AudioPlayer from "../components/AudioPlayer";
import audioFile from "../sample.mp3"; // 임시 MP3 파일 경로 가져오기

function MultiPlay() {
    const [players, setPlayers] = useState(Array(8).fill(null)); // 8자리 초기화
    const [isPlaying, setIsPlaying] = useState(false);
    const [userSeekPosition, setUserSeekPosition] = useState(0);
    const [audioLoaded, setAudioLoaded] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [playbackPosition, setPlaybackPosition] = useState(0);
    const [actualDelay, setActualDelay] = useState(null); // 평균 지연 시간
    const [serverStartTime, setServerStartTime] = useState(null); // 서버의 시작 시간
    const startTimeoutRef = useRef(null);
    const socketRef = useRef(null); // 웹소켓 참조
    const pingTimes = useRef([]); // 지연 시간 측정을 위한 배열

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
        socketRef.current = new WebSocket("ws://localhost:8080");

        socketRef.current.onopen = () => {
            console.log("웹소켓 연결 성공");
        };

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "pingResponse") {
                handlePingResponse(data.sendTime);
            } else if (data.type === "startTime") {
                setServerStartTime(data.startTime); // 서버의 시작 시간 설정
                calculateDelay(); // 지연 시간 측정 시작
            }
        };

        socketRef.current.onerror = (error) => {
            console.error("웹소켓 오류:", error);
        };

        socketRef.current.onclose = () => {
            console.log("웹소켓 연결 종료");
        };
    }, []);

    // 지연 시간 측정을 위해 서버에 ping 메시지 전송
    const sendPing = () => {
        const sendTime = Date.now();
        socketRef.current.send(JSON.stringify({
            type: "ping",
            sendTime,
        }));
    };

    // 서버의 ping 응답을 처리하여 지연 시간 계산
    const handlePingResponse = (sendTime) => {
        const receiveTime = Date.now();
        const roundTripTime = receiveTime - sendTime;
        pingTimes.current.push(roundTripTime / 2); // 왕복 시간을 반으로 나눠서 지연 시간 추가

        if (pingTimes.current.length === 50) {
            const avgDelay = pingTimes.current.reduce((acc, time) => acc + time, 0) / pingTimes.current.length;
            setActualDelay(avgDelay / 1000); // 지연 시간을 초 단위로 설정
        } else {
            sendPing(); // 50번까지 반복하여 서버에 ping 요청
        }
    };

    // 초기 지연 시간 계산 함수
    const calculateDelay = () => {
        pingTimes.current = []; // 초기화
        sendPing(); // 첫 번째 ping 전송
    };

    // 지연 시간 계산이 완료되면 서버 시작 시간을 기준으로 재생 시작
    useEffect(() => {
        if (actualDelay !== null && serverStartTime !== null) {
            handleStartPlayback(serverStartTime);
        }
    }, [actualDelay, serverStartTime]);

    // 서버에서 받은 시작 시간에 따라 클라이언트에서 재생 시작 시각을 조정
    const handleStartPlayback = (serverStartTime) => {
        const clientReceivedTime = Date.now();
        const delayInSeconds = actualDelay; // 초 단위 지연 시간
        const timeUntilStart = (serverStartTime - clientReceivedTime) / 1000 - delayInSeconds; // 지연 고려한 대기 시간 계산

        if (timeUntilStart > 0) {
            console.log(`Starting playback in ${timeUntilStart.toFixed(2)} seconds based on server time.`);
            startTimeoutRef.current = setTimeout(() => {
                setIsPlaying(true);
            }, timeUntilStart * 1000);
        } else {
            console.log("Server start time has already passed. Starting playback immediately.");
            setIsPlaying(true);
        }
    };

    // 시작 버튼 클릭 핸들러
    const handleStartClick = () => {
        if (!audioLoaded) {
            alert("오디오가 아직 로딩되지 않았습니다.");
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
                            <p>실제 지연 시간: {actualDelay ? actualDelay.toFixed(5) : "측정 중"}초</p>
                        </div>
                    ) : (
                        <p>오디오 로딩 중...</p>
                    )}
                </div>

                {/* 시작 버튼 */}
                <button 
                    onClick={handleStartClick} 
                    disabled={!audioLoaded}
                    className={`start-button ${!audioLoaded ? 'disabled' : ''}`}
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
                <AudioPlayer
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    userSeekPosition={userSeekPosition}
                    audioBlob={audioBlob}
                    setAudioLoaded={setAudioLoaded}
                    setDuration={setDuration}
                    onPlaybackPositionChange={handleAudioPlaybackPositionChange}
                />
            </div>
        </div>
    );
}

export default MultiPlay;
