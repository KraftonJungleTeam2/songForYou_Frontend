import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom'; // URL에서 곡 ID 가져오기
import TopBar from '../components/TopBar';
import '../css/MultiPlay.css';
import AudioPlayer from '../components/SyncAudioPlayer';
// import audioFile from '../sample3.mp3'; // 임시 MP3 파일 경로 가져오기
import PitchGraph from '../components/PitchGraph';
import io from 'socket.io-client'; // 시그널링 용 웹소켓 io라고함
import ReservationPopup from '../components/ReservationPopup';
import { useSongs } from '../Context/SongContext';
import axios from 'axios';

// 50ms 단위인 음정 데이터를 맞춰주는 함수 + 음정 타이밍 0.175s 미룸.
function doubleDataFrequency(dataArray) {
  const doubledData = [];
  const referdelay = 175;
  const appendnullnum = referdelay / 25;

  for (let j = 0; j < appendnullnum; j++) {
    doubledData.push(null);
  }

  for (let i = 0; i < dataArray.length; i++) {
    doubledData.push(dataArray[i]); // 첫 번째 복사
    doubledData.push(dataArray[i]); // 두 번째 복사
  }

  return doubledData;
}

function MultiPlay() {
  const [players, setPlayers] = useState(Array(4).fill(null)); // 8자리 초기화
  const [isPlaying, setIsPlaying] = useState(false);

  // 곡 리스트 불러오는 context
  const { songLists, fetchSongLists } = useSongs();

  // 가사 렌더링 하는 state
  const [prevLyric, setPrevLyric] = useState(' ');
  const [currentLyric, setCurrentLyric] = useState(' ');
  const [nextLyric, setNextLyric] = useState(' ');

  const [duration, setDuration] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [connectedUsers, setConnectedUsers] = useState([]);

  //데이터 로딩되었는지 확인하는거
  const [pitchLoaded, setPitchLoaded] = useState(false);
  const [lyricsLoaded, setLyricsLoaded] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);

  const [mrDataBlob, setMrDataBlob] = useState(null);
  const [lyricsData, setLyricsData] = useState(null);

  // 예약 popup에서 작업하는 부분
  const [reservedSongs, setReservedSongs] = useState([]); // 예약된 곡 ID 리스트
  const [currentData, setcurrentData] = useState(null); //현재곡 데이터를 담음
  const [nextData, setnextData] = useState(null);

  // 버튼 끄게 하는 state
  const [isWaiting, setIsWaiting] = useState(true);

  // 지연시간 ping을 위한 state
  const serverTimeDiff = useRef(null);

  //오디오 조절을 위한 state
  const [starttime, setStarttime] = useState();
  const [isMicOn, setIsMicOn] = useState(true);
  const { roomId } = useParams(); // URL에서 songId 추출
  const [showPopup, setshowPopup] = useState(false); // 예약 팝업 띄우는 state

  //웹소켓 부분
  const timeDiffSamplesRef = useRef([]); // 지연 시간 측정을 위한 배열

  //화면 조정을 위한 state들
  const [dimensions, setDimensions] = useState({ width: 0, height: 600 });
  const containerRef = useRef(null);

  // 서버에서 데이터 로딩 후 배열 생성
  const [entireGraphData, setEntireGraphData] = useState([]);
  const [entireReferData, setEntireReferData] = useState([]);

  const [dataPointCount, setDataPointCount] = useState(50);

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

   // 섬네일 업데이트 로직 (미완)
   useEffect(() => {
    if (reservedSongs.length > 0) {
      setcurrentData(reservedSongs[0]);
    }
  }, [reservedSongs]);

   // songContext에서 노래 정보를 불러옴
   useEffect(() => {
    fetchSongLists();
  }, [fetchSongLists]);

    // 재생 위치에 따라 가사 업데이트
    useEffect(() => {
      let curr_idx = -1;
      let segments = [];
      if (lyricsData && lyricsData.segments) {
        segments = lyricsData.segments;
        for (let i = 0; i < segments.length; i++) {
          if (playbackPosition >= segments[i].start) {
            curr_idx = i;
          } else if (curr_idx >= 0) {
            break;
          }
        }
      }
      setPrevLyric(segments[curr_idx - 1]?.text || ' ');
      setCurrentLyric(segments[curr_idx]?.text || ' ');
      setNextLyric(segments[curr_idx + 1]?.text || ' ');
    }, [playbackPosition, lyricsData]);

  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  // player 추가하기
  const addPlayer = (name, userId) => {
    const newPlayer = {
      userId: userId,
      name: name,
      peer: null,
      mic: true,
    };

    setPlayers((prevPlayers) => {
      const index = prevPlayers.findIndex((player) => player === null);
      if (index === -1) return prevPlayers; // 빈자리가 없으면 그대로 반환

      const newPlayers = [...prevPlayers];
      newPlayers[index] = newPlayer;
      return newPlayers;
    });
  };

  // peer 연결되면 state 업데이트하기
  const updatePlayerPeer = (userId, peerConnection) => {
    setPlayers((prevPlayers) => prevPlayers.map((player) => (player?.userId === userId ? { ...player, peer: peerConnection } : player)));
  };
  const updatePlayerMic = (userId, micBool) => {
    setPlayers((prevPlayers) => prevPlayers.map((player) => (player?.userId === userId ? { ...player, mic: micBool } : player)));
  };
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
        video: false,
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
        token: sessionStorage.getItem('userToken'),
      },
    });

    socketRef.current.on('connect', async () => {
      console.log('웹소켓 연결 성공');
      await getLocalStream();
      const token = sessionStorage.getItem('userToken');

      const response = await axios.get(`${process.env.REACT_APP_API_ENDPOINT}/users/info`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const nickname = response.data.name;
      await socketRef.current.emit('joinRoom', {
        roomId: roomId,
        nickname: nickname,
      });
      // 연결되면 바로 서버시간 측정
      timeDiffSamplesRef.current = []; // 초기화
      sendPing(); // 첫 번째 ping 전송
    });

    // Room 이벤트 핸들러
    socketRef.current.on('joinedRoom', ({ roomId, roomInfo, userId }) => {
      const users = roomInfo.users;
      users.forEach((user) => {
        addPlayer(user.nickname, user.id);
      });
    });

    //다른 유저 처음 입장하면 알려줌
    socketRef.current.on('userJoined', ({ user, roomInfo }) => {
      console.log('userJoin', user.userId);
      addPlayer(user.nickname, user.userId);
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

      // peer 연결 상태 모니터링 추가
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
          // peer 연결이 완료되면 players 상태 업데이트
          console.log('1st', callerId);
          updatePlayerPeer(callerId, peerConnection);
        }
      };

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

        peerConnection.onconnectionstatechange = () => {
          if (peerConnection.connectionState === 'connected') {
            // peer 연결이 완료되면 players 상태 업데이트
            console.log('2nd', callerId);
            updatePlayerPeer(callerId, peerConnection);
          }
        };
      }
    });

    socketRef.current.on('micOn', ({ userId }) => {
      console.log('fuckOn');
      updatePlayerMic(userId, true);
    });

    socketRef.current.on('micOff', ({ userId }) => {
      console.log('fuckOff');
      updatePlayerMic(userId, false);
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
    });

    // 웹 소켓으로 데이터 받는 부분 (마운트 작업) #############################################
    // socketRef.current.on('playSong', (data) => {
    //   ``
    // });

    socketRef.current.on('playSong', async (data) => {
      try {
        // fileBlob을 URL로 받는다면 해당 URL을 이용하여 blob으로 변환
        const fileUrl = data.mrUrl;
        if (fileUrl) {
          const fileResponse = await fetch(fileUrl);
          const fileBlob = await fileResponse.blob();
          setMrDataBlob(fileBlob);  // Blob 데이터 저장
        } else {
          console.error('Error: file URL not found in the response');
        }
        
        // 받아진 데이터가 array임 이미 해당 배열 pitch그래프에 기입
        const pitchArray = data.pitch;

        console.log(data.mrUrl);
        console.log(data.pitch);
        console.log(data.lyrics);
        if (Array.isArray(pitchArray)) {
          try {
            // console.log(pitchArray);
            const processedPitchArray = doubleDataFrequency(pitchArray);
            
            setEntireReferData(
              processedPitchArray.map((pitch, index) => ({
                time: index * 25,
                pitch,
              }))
            );
        
            setEntireGraphData(
              processedPitchArray.map((_, index) => ({
                time: index * 25,
                pitch: null,
              }))
            );
        
            setPitchLoaded(true);
          } catch (error) {
            console.error('Error processing pitch data:', error);
            setPitchLoaded(true);
          }
        } else {
          console.error('Error: Expected pitch data to be an array');
          setPitchLoaded(true);
        }
         
        // 가사 데이터 업로드
        setLyricsData(data.lyrics);
        setLyricsLoaded(true);
        
      } catch (error) {
        console.error('Error handling data:', error);
      }
    });

    return () => {
      // Peer 연결 정리
      Object.values(peerConnectionsRef.current).forEach((connection) => {
        connection.close();
      });

      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }

      if (socketRef.current) {
        socketRef.current.close();
      }

      // 스트림 정리
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const micOn = () => {
    if (isMicOn) return;

    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        setIsMicOn(true);
        socketRef.current.emit('userMicOn', {
          roomId: roomId,
        });
        setPlayers((prevPlayers) => prevPlayers.map((player) => (player?.peer === null ? { ...player, mic: true } : player)));
      }
    }
    if (isPlaying) setAudioLatency(200);
  };

  const micOff = () => {
    if (!isMicOn) return;

    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = false;
        setIsMicOn(false);
        socketRef.current.emit('userMicOff', {
          roomId: roomId,
        });
        setPlayers((prevPlayers) => prevPlayers.map((player) => (player?.peer === null ? { ...player, mic: false } : player)));
      }
    }
    if (isPlaying) setAudioLatency(0);
  };
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
      setConnectedUsers((prev) => {
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

      //   if (event.track.kind === 'audio') {
      //     event.track.onunmute = () => {
      //       setPlayers((prevPlayers) => prevPlayers.map((player) => (player?.userId === userId ? { ...player, isSpeaking: true } : player)));
      //     };
      //     event.track.onmute = () => {
      //       setPlayers((prevPlayers) => prevPlayers.map((player) => (player?.userId === userId ? { ...player, isSpeaking: false } : player)));
      //     };
      //   }
    };

    // 로컬 스트림 추가
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionsRef.current[userId] = peerConnection;
    return peerConnection;
  };

  useEffect(() => {
    // 지연 시간 측정 함수
    async function measureLatency() {
      let sqrtRTTs = 0;
      let nUsers = 0;

      for (let key in peerConnectionsRef.current) {
        const peerConnection = peerConnectionsRef.current[key];
        const stats = await peerConnection.getStats();

        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            const rtt = report.currentRoundTripTime;
            sqrtRTTs += Math.sqrt(rtt * 1000);
            nUsers += 1;
            console.log(`RTT to peer ${key}: ${rtt * 1000} ms`);
          }
        });
      }
      if (nUsers) {
        const smre = (sqrtRTTs / nUsers) ** 2;
        setNetworkLatency((networkLatency) => {
          // 점진적인 오차 반영
          const newL = networkLatency * 0.8 + smre * 0.2;
          if (networkLatency - newL > 40 || networkLatency - newL < -40) {
            // 차이가 40이상 나거나
            return newL;
          } else if (networkLatency > 30 && (networkLatency / newL > 2 || networkLatency / newL < 0.5)) {
            // 2배 이상 날 때에만 업데이트를 해서 자주 배속이 걸리지 않도록 하였음.
            return newL;
          } else {
            return networkLatency;
          }
        });
      }
    }
    const interval = setInterval(measureLatency, 1000);

    return () => clearInterval(interval);
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
  };

  const closePopup = () => {
    setshowPopup(false);
  };

  useEffect(() => {
    if (isMicOn) {
      setLatencyOffset(-audioLatency - networkLatency - optionLatency);
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
                    <p>{player.name}</p>{' '}
                    <span role='img' aria-label='mic status'>
                      {player.mic ? '🎤' : '🔇'}
                    </span>
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
              // songState={currentData}
            />
          </div>

          {/* Seek Bar */}
          {/* <div className='seek-bar-container'>
            <input type='range' min='0' max={duration} step='0.025' value={playbackPosition} className='range-slider' disabled={!audioLoaded} />
            <div className='playback-info'>
              {playbackPosition.toFixed(3)} / {duration.toFixed(2)} 초
            </div>
          </div> */}
          
            {/* 현재 재생 중인 가사 출력 */}
            <div className='karaoke-lyrics' style={{marginTop :'75px'}}>
            <p className='prev-lyrics'>{prevLyric}</p>
            <p className='curr-lyrics'>{currentLyric}</p>
            <p className='next-lyrics'>{nextLyric}</p>
          </div>


          <div className='button-area'>
            {/* 시작 버튼 */}
            <button onClick={handleStartClick} disabled={!audioLoaded || isPlaying || isWaiting || starttime != null || !pitchLoaded || !lyricsLoaded} className={`button start-button ${!audioLoaded || isWaiting ? 'is-loading' : ''}`}>
              {audioLoaded ? '노래 시작' : '로딩 중...'}
            </button>

            {/* 마이크 토글 버튼 */}
            <button
              className={`button mic-button ${!isPlaying ? 'is-disabled' : ''}`} // 버튼 스타일 변경
              onClick={isMicOn ? micOff : micOn}
              //   disabled={!isPlaying} // isPlaying이 false일 때 버튼 비활성화
            >
              {isMicOn ? '마이크 끄기' : '마이크 켜기'}
            </button>

            <button className='button reservation-button' onClick={OnPopup}>
              시작하기 or 예약하기
            </button>
            <h3>networkLatency: {networkLatency}</h3>
            {/* 오디오 엘리먼트들 */}
            <audio id='localAudio' autoPlay muted />
            <div className='remote-audios' style={{ display: 'none' }}>
              {connectedUsers.map((userId) => (
                <audio key={userId} id={`remoteAudio_${userId}`} autoPlay />
              ))}
            </div>
          </div>

          {/* 조건부 렌더링 부분 popup */}
          {showPopup && (
            <ReservationPopup roomid={roomId} socket={socketRef.current} onClose={closePopup} reservedSongs={reservedSongs} setReservedSongs={setReservedSongs} songLists={songLists} currentData={currentData} nextData={nextData}  />
          )}

          {/* AudioPlayer 컴포넌트 */}
          <AudioPlayer isPlaying={isPlaying} setIsPlaying={setIsPlaying} audioBlob={mrDataBlob} setAudioLoaded={setAudioLoaded} setDuration={setDuration} onPlaybackPositionChange={setPlaybackPosition} starttime={starttime} setStarttime={setStarttime} setIsWaiting={setIsWaiting} setIsMicOn={setIsMicOn} latencyOffset={latencyOffset} />
        </div>
      </div>
    </div>
  );
}

export default MultiPlay;
