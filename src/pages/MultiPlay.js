import { useEffect, useState, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom'; // URL에서 곡 ID 가져오기
import TopBar from '../components/TopBar';
import '../css/MultiPlay.css';
import AudioPlayer from '../components/SyncAudioPlayer';
import audioFile from '../sample.mp3'; // 임시 MP3 파일 경로 가져오기
import PitchGraph from '../components/PitchGraph';
import io from 'socket.io-client'; // 시그널링 용 웹소켓 io라고함
import ReservationPopup from '../components/ReservationPopup'

function MultiPlay() {
  const [players, setPlayers] = useState(Array(4).fill(null)); // 8자리 초기화
  const [isPlaying, setIsPlaying] = useState(false);

  const [isSocketOpen, setIsSocketOpen] = useState(false);
  const [userSeekPosition, setUserSeekPosition] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [connectedUsers, setConnectedUsers] = useState([]);

  // 예약 popup에서 작업하는 부분
  const [reservedSongs, setReservedSongs] = useState([]); // 예약된 곡 ID 리스트

  // 버튼 끄게 하는 state
  const [isWaiting, setIsWaiting] = useState(true);

  // 지연시간 ping을 위한 state
  const serverTimeDiff = useRef(null);

  //오디오 조절을 위한 state
  const [starttime, setStarttime] = useState();
  const [isMicOn, setIsMicOn] = useState(false);
  const { roomId } = useParams(); // URL에서 songId 추출
  const [showPopup, setshowPopup] = useState(false); // 예약 팝업 띄우는 state

  //웹소켓 부분
  const timeDiffSamplesRef = useRef([]); // 지연 시간 측정을 위한 배열
  const peerConnections = {}; // 개별 연결을 저장한 배열 생성
  let localStream; // 마이크 로컬 스트림

  //화면 조정을 위한 state들
  const [dimensions, setDimensions] = useState({ width: 0, height: 600 });
  const containerRef = useRef(null);

  // 서버에서 데이터 로딩 후 배열 생성
  const [entireGraphData, setEntireGraphData] = useState([]);
  const [entireReferData, setEntireReferData] = useState([]);

  const [dataPointCount, setDataPointCount] = useState(200);

  // useRef로 관리하는 변수들
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const pingTimesRef = useRef([]);

  // 서버시간 측정을 위해
  // 최소/최대 핑 요청 횟수
  const MAXPING = 50;
  const MINPING = 10;
  // 최대 허용 오차(ms)
  const MAXERROR = 10;
  const [audioLatency, setAudioLatency] = useState(0);
  const [networkLatency, setNetworkLatency] = useState(0);
  const [optionLatency, setOptionLatency] = useState(0);
  const [latencyOffset, setLatencyOffset] = useState(0);


  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  // 로컬 MP3 파일을 Blob으로 변환
  useEffect(() => {
    const loadAudioBlob = async () => {
      try {
        const response = await fetch(audioFile);
        const blob = await response.blob();
        setAudioBlob(blob);
      } catch (error) {
        console.error('오디오 파일 로드 실패:', error);
      }
    };

    loadAudioBlob();

    return () => {
      if (socketRef.current) {
          socketRef.current.close();
      }
      // 스트림 정리
      if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      // Peer 연결 정리
      Object.values(peerConnectionsRef.current).forEach(connection => {
          connection.close();
      });
    };
  }, []);

  // 마이크 스트림 획득
  const getLocalStream = async () => {
    try {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
            audio: true,
            // audio: {
            //   autoGainControl: false, // 자동 게인 제어
            //   echoCancellation: false,  // 에코 제거
            //   noiseSuppression: false,   // 노이즈 억제
            //   voiceIsolation: false,
            //   }, 
            video: false 
        });
        const audioElement = document.getElementById('localAudio');
        if (audioElement) {
            audioElement.srcObject = localStreamRef.current;
        }
    } catch (error) {
        console.error('마이크 스트림 오류:', error);
    }
  };
  
    // WebSocket 연결 설정
    useEffect(() => {
      socketRef.current = io(`${process.env.REACT_APP_EXPRESS_APP}`, {
          path: '/wss',
          auth: {
              token: sessionStorage.getItem('userToken')
          }
      });

      socketRef.current.on('connect', async () => {
          console.log('웹소켓 연결 성공');
          setIsSocketOpen(true);
          await getLocalStream();
          socketRef.current.emit('joinRoom', {
              roomId: roomId,
              nickname: 'nickname',
          });
          
          // 연결되면 바로 서버시간 측정
          timeDiffSamplesRef.current = []; // 초기화
          sendPing(); // 첫 번째 ping 전송
      });

      // Room 이벤트 핸들러
      socketRef.current.on('joinedRoom', ({ roomId, roomInfo }) => {
          console.log('방 입장 성공:', roomInfo);
      });

      // Peer Connection 초기화
      socketRef.current.on('initPeerConnection', async (existingUsers) => {
          existingUsers.forEach(async (user) => {
              const peerConnection = await createPeerConnection(user.id);
              
              const offer = await peerConnection.createOffer();
              await peerConnection.setLocalDescription(offer);

              socketRef.current.emit('offer', {
                  targetId: user.id,
                  offer: offer,
              });
          });
      });

      // Offer 처리
      socketRef.current.on('offer', async ({ offer, callerId }) => {
          const peerConnection = await createPeerConnection(callerId);
          await peerConnection.setRemoteDescription(offer);

          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          socketRef.current.emit('answer', {
              targetId: callerId,
              answer: answer,
          });
      });

      // Answer 처리
      socketRef.current.on('answer', async ({ answer, callerId }) => {
          const peerConnection = peerConnectionsRef.current[callerId];
          if (peerConnection) {
              await peerConnection.setRemoteDescription(answer);
          }
      });

      // ICE candidate 처리
      socketRef.current.on('ice-candidate', async ({ candidate, callerId }) => {
          const peerConnection = peerConnectionsRef.current[callerId];
          if (peerConnection) {
              await peerConnection.addIceCandidate(candidate);
          }
      });

    // 서버로부터 ping 응답을 받으면 handlePingResponse 호출
    socketRef.current.on('pingResponse', (data) => {
      const receiveTime = Date.now();
      const { sendTime, serverTime } = data;

      handlePingResponse(sendTime, serverTime, receiveTime);
    });

    socketRef.current.on('startTime', (data) => {
      // 이미 구해진 지연시간을 가지고 클라이언트에서 시작되어야할 시간을 구함.
      const serverStartTime = data.startTime;
      const clientStartTime = serverStartTime + serverTimeDiff.current;

      // 클라이언트 시작시간을 starttime으로 정하면 audio내에서 delay 작동 시작
      setStarttime(clientStartTime);
    })

      return () => {
          Object.values(peerConnectionsRef.current).forEach(connection => {
              connection.close();
          });
          
          if (socketRef.current?.connected) {
              socketRef.current.disconnect();
          }
      };
  }, []);

    // Peer Connection 생성 함수
    const createPeerConnection = async (userId) => {
      const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
              socketRef.current.emit('ice-candidate', {
                  candidate: event.candidate,
                  targetId: userId,
              });
          }
      };

      peerConnection.ontrack = (event) => {
          setConnectedUsers(prev => {
              if (!prev.includes(userId)) {
                  return [...prev, userId];
              }
              return prev;
          });

          setTimeout(() => {
              const audioElement = document.getElementById(`remoteAudio_${userId}`);
              if (audioElement && event.streams[0]) {
                  audioElement.srcObject = event.streams[0];
              }
          }, 100);
      };

      // 로컬 스트림 추가
      if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
              peerConnection.addTrack(track, localStreamRef.current);
          });
      }

      peerConnectionsRef.current[userId] = peerConnection;
      return peerConnection;
    };
    
    useEffect( ()=> {
      // 지연 시간 측정 함수
      async function measureLatency() {
        let sqrtRTTs = 0;
        let nUsers = 0;
  
        for (let key in peerConnectionsRef.current) {
          const peerConnection = peerConnectionsRef.current[key];
          const stats = await peerConnection.getStats();
  
          stats.forEach((report) => {
            if (report.type === "candidate-pair" && report.state === "succeeded") {
              const rtt = report.currentRoundTripTime;
              sqrtRTTs += Math.sqrt(rtt*1000);
              nUsers += 1;
              console.log(`RTT to peer ${key}: ${rtt * 1000} ms`);
            }
          });
        }
        if (nUsers) {
          const smre = (sqrtRTTs/nUsers) ** 2;
          console.log(`set network latency as: ${networkLatency*0.9 + smre*0.1}`)
          setNetworkLatency(networkLatency*0.9 + smre*0.1);
        }
      }
      console.log("dsioghw");
      setInterval(measureLatency, 1000);

    }, []);
    




  
  
  
  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

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

  // 재생 위치 변경 핸들러 (seek bar)
  const handlePlaybackPositionChange = (e) => {
    const newPosition = parseFloat(e.target.value);
    setUserSeekPosition(newPosition);
    setPlaybackPosition(newPosition);
  };
  
  // 지연 시간 측정을 위해 서버에 ping 메시지 전송 함수
  const sendPing = () => {
    const sendTime = Date.now();
    socketRef.current.emit('ping', {
      sendTime,
    });
  };

  // 서버의 ping 응답을 처리하여 지연 시간 계산 함수
  const handlePingResponse = (sendTime, serverTime, receiveTime) => {
    const roundTripTime = receiveTime - sendTime;
    const serverTimeAdjusted = serverTime + roundTripTime / 2;
    timeDiffSamplesRef.current.push(receiveTime - serverTimeAdjusted);
    timeDiffSamplesRef.current.sort();
    const nSamples = timeDiffSamplesRef.current.length;
    const q = Math.floor(nSamples / 4);
    const IQR = timeDiffSamplesRef.current[q] - timeDiffSamplesRef.current[nSamples - 1 - q];
    // 최대 핑 횟수가 되었거나 | 최소 핑 횟수 이상이면서 편차가 최대허용오차보다 작으면 성공
    if (nSamples >= MAXPING || (nSamples >= MINPING && IQR <= MAXERROR)) {
      // 측정 완료시 서버시간차이를 저장 하고 종료
      const estTimeDiff = timeDiffSamplesRef.current[2 * q];
      serverTimeDiff.current = estTimeDiff;
      setIsWaiting(false);
    } else {
      // 측정이 더 필요한 경우 최대횟수까지 서버에 ping 요청
      sendPing();
    }
  };

  // 시작 버튼 누르면 곡 시작하게 하는 부분.
  const handleStartClick = () => {
    setIsWaiting(true);
    if (!audioLoaded) {
      alert('오디오가 아직 로딩되지 않았습니다.');
      setIsWaiting(false);
      return;
    }

    // 서버에 시작 요청 보내기 임시임
    socketRef.current.emit('requestStartTimeWithDelay', {
      roomId: roomId
    });
  };


  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  const OnPopup = () => {
    setshowPopup(true);
  }

  const closePopup = () => {
    setshowPopup(false);
  }

  const micOn = () => {
    if (isMicOn) return;
    setIsMicOn(true);

    if (isPlaying)
      setAudioLatency(200);
  }
  const micOff = () => {
    if (!isMicOn) return;
    setIsMicOn(false);

    if (isPlaying)
      setAudioLatency(0);
  }

  useEffect(() => {
    if (isMicOn) {
      setLatencyOffset(-audioLatency-networkLatency-optionLatency);
    } else {
      setLatencyOffset(0);
    }
  }, [audioLatency, networkLatency, optionLatency, isMicOn]);

  return (
    <div className='multiPlay-page'>
      <TopBar className='top-bar' />
      
      <div className='multi-content'>
        <div className='players-chat'>
          <div className='players'>
            {players.map((player, index) => (
              <div key={index} className='player-card'>
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

          <div className='chat-area'>
            <p>chating area</p>
          </div>
        </div>
        <div className='sing-area' ref={containerRef}>
          <div className='information-area'>
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

          <div className='pitch-graph-multi' style={{ height: '500px' }}>
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
          <div className='seek-bar-container'>
            <input type='range' min='0' max={duration} step='0.025' value={playbackPosition} onChange={handlePlaybackPositionChange} className='range-slider' disabled={!audioLoaded} />
            <div className='playback-info'>
              {playbackPosition.toFixed(3)} / {duration.toFixed(2)} 초
            </div>
          </div>

          <div className='button-area'>
            {/* 시작 버튼 */}
            <button onClick={handleStartClick} disabled={!audioLoaded || isPlaying || isWaiting || starttime != null} className={`button start-button ${!audioLoaded || isWaiting ? 'is-loading' : ''}`}>
              {audioLoaded ? '노래 시작' : '로딩 중...'}
            </button>

            {/* 마이크 토글 버튼 */}
            <button
              className='button mic-button'
              onClick={isMicOn ? micOff : micOn}>
              {' '}
              {isMicOn ? '마이크 끄기' : '마이크 켜기'}
            </button>

            <button className='button reservation-button' onClick={OnPopup}>
              예약하기
            </button>
            <h3>networkLatency: {networkLatency}</h3>
            {/* 오디오 엘리먼트들 */}
            <audio id='localAudio' autoPlay muted />
            <div className="remote-audios" style={{ display: 'none' }}>
                {connectedUsers.map(userId => (
                    <audio
                        key={userId}
                        id={`remoteAudio_${userId}`}
                        autoPlay
                    />
                ))}
            </div>
          </div>

          {/* 조건부 렌더링 부분 popup */}
          {showPopup && (
            <ReservationPopup socket={socketRef.current} onClose={closePopup} reservedSongs={reservedSongs} setReservedSongs={setReservedSongs} />
          )}




          {/* AudioPlayer 컴포넌트 */}
          <AudioPlayer
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            userSeekPosition={userSeekPosition}
            audioBlob={audioBlob}
            setAudioLoaded={setAudioLoaded}
            setDuration={setDuration}
            onPlaybackPositionChange={handlePlaybackPositionChange}
            starttime={starttime}
            setStarttime={setStarttime}
            setIsWaiting={setIsWaiting}
            setIsMicOn={setIsMicOn}
            latencyOffset={latencyOffset} />
        </div>
      </div>
    </div>
  );
};

export default MultiPlay;
