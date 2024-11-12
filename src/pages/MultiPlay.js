import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom'; // URL에서 곡 ID 가져오기
import Sidebar from '../components/SideBar';
import TopBar from '../components/TopBar';
import '../css/MultiPlay.css';
import AudioPlayer from '../components/SyncAudioPlayer';
// import audioFile from '../sample3.mp3'; // 임시 MP3 파일 경로 가져오기
import PitchGraph from '../components/PitchGraph';
import io from 'socket.io-client'; // 시그널링 용 웹소켓 io라고함
import ReservationPopup from '../components/ReservationPopup';
import { useSongs } from '../Context/SongContext';
import axios from 'axios';
import { usePitchDetection } from '../components/usePitchDetection';
import { useNavigate } from 'react-router-dom';
// 콘솔로그 그만
import measureLatency from '../components/LatencyCalc';
import '../css/slider.css';
import PlayerCard from '../components/PlayerCard';
import NowPlayingLyrics from '../components/nowPlayingLyrics';
import { useScreen } from '../Context/ScreenContext';
import MobileNav from '../components/MobileNav';
import PageTemplate from '../template/PageTemplate';

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
    if (dataArray[i] > 0 && dataArray[i + 1] > 0) doubledData.push((dataArray[i + 1] + dataArray[i]) / 2); // 두 번째 복사
    else doubledData.push(null);
  }

  return doubledData;
}

function MultiPlay() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isMobile } = useScreen();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const navigate = useNavigate();

  const { roomId } = useParams(); // URL에서 songId 추출

  const socketId = useRef(null); // 나의 소켓 id
  const [players, setPlayers] = useState([]); // 4자리 초기화
  // 네트워크 계산 시 사용할 {소켓id: 마이크 상태}
  // player 정보 갱신할 때 이 ref도 다뤄주세요
  const micStatRef = useRef({});
  const [isPlaying, setIsPlaying] = useState(false); // isPlaying을 여기서 유저가 변경하게 하지 말 것. starttime을 set하여 시작.

  // 곡 리스트 불러오는 context
  const { songLists, fetchSongLists } = useSongs();

  // 가사 렌더링 하는 state
  const [prevLyric, setPrevLyric] = useState(' ');
  const [currSegment, setCurrSegment] = useState(' ');
  const [nextLyric, setNextLyric] = useState(' ');

  const [duration, setDuration] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const playbackPositionRef = useRef(playbackPosition);
  playbackPositionRef.current = playbackPosition;

  //데이터 로딩되었는지 확인하는거

  const [mrDataBlob, setMrDataBlob] = useState(null);
  const [lyricsData, setLyricsData] = useState(null);

  // 예약 popup에서 작업하는 부분
  const [reservedSongs, setReservedSongs] = useState([]); // 예약된 곡 ID 리스트
  const [currentData, setcurrentData] = useState(null);

  // 버튼 끄게 하는 state
  const [isWaiting, setIsWaiting] = useState(true);
  //
  const audioPlayerRef = useRef();
  // 지연시간 ping을 위한 state
  const [serverTimeDiff, setServerTimeDiff] = useState(null);
  const serverTimeDiffRef = useRef(null);
  //오디오 조절을 위한 state
  const [starttime, setStarttime] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showPopup, setshowPopup] = useState(false); // 예약 팝업 띄우는 state

  const startTimeRef = useRef(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

  //웹소켓 부분
  const timeDiffSamplesRef = useRef([]); // 지연 시간 측정을 위한 배열

  //화면 조정을 위한 state들
  const [dimensions, setDimensions] = useState({ width: 100, height: 600 });
  const containerRef = useRef(null);

  // 서버에서 데이터 로딩 후 배열 생성
  const [entireGraphData, setEntireGraphData] = useState([]);
  const [entireReferData, setEntireReferData] = useState([]);
  const entireReferDataRef = useRef([]);
  const [dataPointCount, setDataPointCount] = useState(75);

  //채팅 관련
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null); // 자동 스크롤용

  // useRef로 관리하는 변수들
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const dataChannelsRef = useRef({}); // DataChannel 저장소 추가
  const latencyDataChannelsRef = useRef({}); // 레이턴시용 DataChannel 저장소 추가
  const pitchArraysRef = useRef({}); //  pitchArrays
  const candidatesRef = useRef({}); // candidates before est

  const [useCorrection, setUseCorrection] = useState(true);

  // 서버시간 측정을 위해
  // 최소/최대 핑 요청 횟수
  const MAXPING = 50;
  const MINPING = 10;
  // 최대 허용 오차(ms)
  const MAXERROR = 7;
  const audioConstant = 150;
  const [audioDelay, setAudioDelay] = useState(audioConstant);
  const [singerNetworkDelay, setSingerNetworkDelay] = useState(0.0);
  const [listenerNetworkDelay, setListenerNetworkDelay] = useState(0.0);
  const [optionDelay, setOptionDelay] = useState(0);
  const [jitterDelay, setJitterDelay] = useState(0);
  const [playoutDelay, setPlayoutDelay] = useState(0);
  const [latencyOffset, setLatencyOffset] = useState(0);
  const singersDelay = useRef({});
  const RTTRef = useRef({});

  // latencyCalc.js에서 사용
  const latencyCalcRef = useRef({});

  // 볼륨 조절 용. 0.0-1.0의 값
  const [musicGain, setMusicGain] = useState(0.5);

  // 점수 확인 용
  const [score, setScore] = useState(0);
  const [instantScore, setInstantScore] = useState(0);

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 메시지 전송
  const sendMessage = () => {
    const timestamp = new Date();
    if (inputMessage.trim()) {
      socketRef.current.emit('sendMessage', {
        roomId: roomId,
        text: inputMessage,
        timestamp: timestamp,
      });

      setMessages((prev) => [...prev, { text: inputMessage, timestamp: timestamp }]);
      setInputMessage('');
    }
  };

  // songContext에서 노래 정보를 불러옴
  useEffect(() => {
    if (songLists.public.length === 0) {
      fetchSongLists();
    }
  }, []);

  useEffect(() => {
    serverTimeDiffRef.current = serverTimeDiff;
    if (audioLoaded && startTimeRef.current && serverTimeDiffRef.current) {
      setStarttime(startTimeRef.current + serverTimeDiffRef.current);
      startTimeRef.current = null;
    }
  }, [audioLoaded, serverTimeDiff]);

  useEffect(() => {
    entireReferDataRef.current = entireReferData;
  }, [entireReferData]);

  useEffect(() => {
    if (currentData !== null && currentData.ready == true) {
      setMrDataBlob(currentData.songData.mr); // Blob 데이터 저장
      setLyricsData(currentData.songData.lyrics);
      const pitchArray = currentData.songData.pitch;
      if (Array.isArray(pitchArray)) {
        try {
          const processedPitchArray = doubleDataFrequency(pitchArray);
          setEntireReferData(processedPitchArray);
          setEntireGraphData(new Array(processedPitchArray.length).fill(null));

          Object.keys(dataChannelsRef.current).forEach((key) => {
            pitchArraysRef.current[key] = new Array(processedPitchArray.length).fill(null);
          });
        } catch (error) {
          console.error('Error processing pitch data:', error);
        }
      } else {
        console.error('Error: Expected pitch data to be an array');
      }
      setIsWaiting(false);
    }
  }, [currentData]);

  useEffect(() => {
    console.log('reserved song');
    if (reservedSongs.length === 0) {
      setEntireGraphData([]);
      setEntireReferData([]);
      setLyricsData(null);
      return;
    }
    console.log('reserved song', reservedSongs);
    if (currentData !== reservedSongs?.[0]) {
      if (reservedSongs[0].ready === false && reservedSongs[0].songData !== null) {
        socketRef.current.emit('songReady', {
          roomId,
          songId: reservedSongs[0].songId,
        });
      }
      setcurrentData(reservedSongs[0]);
    }

    const loadSongData = async (songId, index) => {
      try {
        // 소켓을 통해 서버에 데이터 요청
        socketRef.current.emit('requestSongData', {
          roomId,
          songId,
          position: index,
        });
      } catch (error) {
        console.error(`Error loading song data for position ${index}:`, error);
      }
    };
    if (reservedSongs[0] && reservedSongs[0].songData === null) {
      loadSongData(reservedSongs[0].songId, 0);
    }
    if (reservedSongs[1] && reservedSongs[1].songData === null) {
      loadSongData(reservedSongs[1].songId, 1);
    }
  }, [reservedSongs]);

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
    setCurrSegment(segments[curr_idx] || ' ');
    setNextLyric(segments[curr_idx + 1]?.text || ' ');
  }, [playbackPosition, lyricsData]);

  // loadaudio 함수 정의
  const loadData = async (data, index) => {
    try {
      // fileBlob을 URL로 받는다면 해당 URL을 이용하여 blob으로 변환
      const fileUrl = data.mrUrl;
      if (fileUrl) {
        const fileResponse = await fetch(fileUrl);

        setReservedSongs((prevSongs) => {
          const updatedSongs = [...prevSongs];
          updatedSongs[index] = {
            ...updatedSongs[index], // 기존 속성 유지
            songData: {
              mr: fileResponse,
              lyrics: data.lyrics,
              pitch: data.pitch,
            },
          };
          return updatedSongs;
        });
      } else {
        console.error('Error: file URL not found in the response');
      }
    } catch (error) {
      console.error('Error handling data load:', error);
    }
  };

  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  // player 추가하기
  const addPlayer = (name, userId, mic) => {
    const newPlayer = {
      userId: userId,
      name: name,
      mic: mic,
      isAudioActive: false,
      score: null,
      volume: 50,
    };
    setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);
    micStatRef.current[userId] = mic;
  };

  // player 삭제하기
  const removePlayer = (userId) => {
    setPlayers((prevPlayers) => prevPlayers.filter((player) => player.userId !== userId));
    delete micStatRef.current[userId];
  };

  const updatePlayerMic = (userId, micBool) => {
    setPlayers((prevPlayers) => prevPlayers.map((player) => (player?.userId === userId ? { ...player, mic: micBool } : player)));
    micStatRef.current[userId] = micBool;
  };

  //노래 곡 싱크 맞추기
  const setReserved = async (songs) => {
    const formattedSongs = songs.map((song) => ({
      songId: song.songId,
      ready: song.readyBool,
      songData: null, // 데이터는 나중에 로드
      image: song.image,
      title: song.title,
      description: song.description,
    }));

    if (songs[0] && songs[0].readyBool) {
      let songId = songs[0].songId;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_ENDPOINT}/songs/play/${songId}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // http 통신에서 전달받은 reponse 패킷? 같은 것을 다 뜯어서 formData로 파싱하는 것임.
        const formData = await response.formData();
        const result = Object.fromEntries(formData.entries());

        formattedSongs[0].songData = {
          mr: result.file,
          lyrics: JSON.parse(result.lyrics),
          pitch: JSON.parse(result.pitch),
        };
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    // 현재 재생 중인 곡이 있다면 (playing: true)
    const currentPlayingSong = songs.find((song) => song.playing);
    if (currentPlayingSong) {
      // 서버 시간과 클라이언트 시간 차이를 고려하여 시작 시간 설정
      const clientStartTime = currentPlayingSong.startTime;
      startTimeRef.current = clientStartTime;
    }
    setReservedSongs(formattedSongs);
  };

  // 마이크 스트림 획득
  const getLocalStream = async () => {
    try {
      // 기존 스트림이 있다면 정리
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });

      // 트랙 상태 모니터링
      stream.getAudioTracks().forEach((track) => {
        track.onended = async () => {
          console.log('Audio track ended, attempting to recover');
          // 트랙이 의도치 않게 종료된 경우 재연결 시도
          if (isMicOn) {
            await getLocalStream();
          }
        };
      });

      localStreamRef.current = stream;

      return stream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      // throw error;
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

      const response = await fetch(
        `${process.env.REACT_APP_API_ENDPOINT}/users/info`,
        {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`, // 토큰을 Authorization 헤더에 추가
          },
        }
      );

      const formData = await response.formData();
    
      const result = Object.fromEntries(formData.entries());
      
      const info = JSON.parse(result.info);

      const nickname = info.name;
      await socketRef.current.emit("joinRoom", {
        roomId: roomId,
        nickname: nickname,
        mic: isMicOn,
      });
      // 연결되면 바로 서버시간 측정
      timeDiffSamplesRef.current = []; // 초기화
      sendPing(); // 첫 번째 ping 전송
    });

    // 클라이언트 측
    socketRef.current.on('connect_error', (error) => {
      console.error('Connection failed:', error.message);
      navigate('/multi');
    });

    socketRef.current.on('error', (message) => {
      console.error('Connection failed:', message);
      navigate('/multi');
    });
    socketRef.current.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Room 이벤트 핸들러
    socketRef.current.on('joinedRoom', ({ roomId, roomInfo, userId, songs }) => {
      const users = roomInfo.users;
      socketId.current = userId;
      users.forEach((user) => {
        addPlayer(user.nickname, user.id, user.mic);
      });
      if (songs) setReserved(songs);
    });

    // 들어온 유저가 있을 때
    socketRef.current.on('userJoined', ({ user, roomInfo }) => {
      addPlayer(user.nickname, user.userId, user.mic);
    });

    // 나간 유저가 있을 때
    socketRef.current.on('userLeft', ({ userId, roomInfo }) => {
      removePlayer(userId);
    });

    // Peer Connection 초기화
    socketRef.current.on('initPeerConnection', async (existingUsers) => {
      existingUsers.forEach(async (user) => {
        console.log(user.id, '에 rtc 연결중');
        const peerConnection = await createPeerConnection(user.id);

        // ICE handler 추가
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit('ice-candidate', {
              targetId: user.id,
              candidate: event.candidate,
            });
          }
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log(user.id, '에 offer 요청');
        socketRef.current.emit('offer', {
          targetId: user.id,
          offer: offer,
        });
      });
    });

    // Offer 처리
    socketRef.current.on('offer', async ({ offer, callerId }) => {
      const peerConnection = await createPeerConnection(callerId);
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice-candidate', {
            targetId: callerId,
            candidate: event.candidate,
          });
        }
      };
      await peerConnection.setRemoteDescription(offer);

      if (candidatesRef.current[callerId]) {
        for (const candidate of candidatesRef.current[callerId]) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
        delete candidatesRef.current[callerId];
      }

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log(callerId, '에서 offer 수신');
      console.log(callerId, '에 answer 요청');

      socketRef.current.emit('answer', {
        targetId: callerId,
        answer: answer,
      });
    });

    // Answer 처리
    socketRef.current.on('answer', async ({ answer, callerId }) => {
      const peerConnection = peerConnectionsRef.current[callerId];
      console.log(callerId, '에서 answer 수신');

      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }

      if (candidatesRef.current[callerId]) {
        for (const candidate of candidatesRef.current[callerId]) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
        delete candidatesRef.current[callerId];
      }
    });

    // ICE candidate 처리
    socketRef.current.on('ice-candidate', async ({ candidate, callerId }) => {
      const peerConnection = peerConnectionsRef.current[callerId];
      if (peerConnection?.remoteDescription) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        if (!candidatesRef.current[callerId]) candidatesRef.current[callerId] = new Array();

        candidatesRef.current[callerId].push(candidate);
      }
    });

    // 연결 실패 시 재실행 핸들러
    socketRef.current.on('reconnect-request', async ({ calleeId }) => {
      try {
        const peerConnection = peerConnectionsRef.current[calleeId];
        if (!peerConnection) return;

        // 새로운 offer 생성 (ICE restart)
        const offer = await peerConnection.createOffer({ iceRestart: true });
        await peerConnection.setLocalDescription(offer);

        // 새로운 offer를 원래 요청자에게 전송
        socketRef.current.emit('offer', {
          targetId: calleeId,
          offer: offer,
        });
      } catch (error) {
        console.error('Reconnection request handling failed:', error);
      }
    });

    socketRef.current.on('micOn', ({ userId }) => {
      updatePlayerMic(userId, true);
    });

    socketRef.current.on('micOff', ({ userId }) => {
      updatePlayerMic(userId, false);
    });

    // 서버로부터 ping 응답을 받으면 handlePingResponse 호출
    socketRef.current.on('pingResponse', (data) => {
      const receiveTime = performance.now();
      const { sendTime, serverTime } = data;

      handlePingResponse(sendTime, serverTime, receiveTime);
    });

    socketRef.current.on('startTime', (data) => {
      setIsWaiting(true);

      // 이미 구해진 지연시간을 가지고 클라이언트에서 시작되어야할 시간을 구함.
      const serverStartTime = data.startTime;
      const clientStartTime = serverStartTime + serverTimeDiffRef.current;

      // 클라이언트 시작시간을 starttime으로 정하면 audio내에서 delay 작동 시작
      setScore(0);
      micOff();
      console.log('starts at', clientStartTime);
      setStarttime(clientStartTime);
    });

    socketRef.current.on('stopMusic', (data) => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.stopAudio(); // handleStopAudio 함수를 호출
      }
    });

    // 웹 소켓으로 데이터 받는 부분 (마운트 작업) #############################################
    socketRef.current.on('reservedData', (data) => {
      const { song, index } = data;
      try {
        loadData(song, index);
      } catch (error) {
        console.error('Error processing download playsong data:', error);
      }
    });

    socketRef.current.on('songAdded', (data) => {
      try {
        console.log(data);

        const reserved = {
          ready: false,
          songId: data.song.id,
          image: data.song.image,
          songData: null,
          title: data.song.metadata.title,
          description: data.song.metadata.description,
        };
        setReservedSongs((prev) => [...prev, reserved]);
      } catch (error) {
        console.error('Error processing download playsong data:', error);
      }
    });

    socketRef.current.on('songReady', (data) => {
      try {
        const { songId } = data;
        setReservedSongs((prevSongs) => {
          return prevSongs.map((song) => {
            // songId가 일치하는 곡을 찾아서 업데이트
            if (song.songId === songId) {
              return {
                ...song,
                ready: true, // ready 값을 true로 변경
              };
            }
            return song; // 일치하지 않는 곡은 그대로 반환
          });
        });
      } catch (error) {}
    });

    socketRef.current.on('reservationCanceled', ({ songId }) => {
      setReservedSongs((prevSongs) => {
        return prevSongs.filter((reserved) => reserved.songId !== songId);
      });
    });

    return () => {
      // Peer 연결 정리
      Object.values(peerConnectionsRef.current).forEach((connection) => {
        connection.close();
      });

      Object.values(dataChannelsRef.current).forEach((channel) => {
        channel.close();
      });
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (socketRef.current) {
        socketRef.current.emit('leaveRoom', { roomId });

        const events = ['connect', 'error', 'receiveMessage', 'joinedRoom', 'userJoined', 'userLeft', 'initPeerConnection', 'offer', 'answer', 'ice-candidate', 'micOn', 'micOff', 'pingResponse', 'startTime', 'playSong'];

        events.forEach((event) => {
          socketRef.current.off(event);
        });

        socketRef.current.disconnect();
      }
    };
  }, []);

  const micOn = async () => {
    if (isMicOn) return;

    try {
      if (!localStreamRef.current || !localStreamRef.current.active) {
        await getLocalStream();
      }

      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        // peer connections 업데이트
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
          if (sender) {
            sender.replaceTrack(audioTrack);
          }
        });

        setIsMicOn(true);
        socketRef.current.emit('userMicOn', { roomId });
        updatePlayerMic(socketId.current, true);

        setAudioDelay(audioConstant); // 음원 디코딩부터 마이크 신호 인코딩까지 지연 추정값
      }
    } catch (error) {
      console.error('Error in micOn:', error);
    }
  };

  const micOff = () => {
    if (!isMicOn) return;

    try {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
        }
      }
      setIsMicOn(false);
      updatePlayerMic(socketId.current, false);
      socketRef.current.emit('userMicOff', { roomId });
      setAudioDelay(0);
      setInstantScore(0);
    } catch (error) {
      console.error('Error in micOff:', error);
    }
  };

  // 2. ICE 재협상 함수
  const restartICE = async (peerConnection, userId) => {
    try {
      // 기존 연결이 initiator(offer를 보낸 쪽)였는지 확인
      const isInitiator = peerConnection.localDescription?.type === 'offer';

      if (isInitiator) {
        // offer를 다시 생성할 때 iceRestart: true 옵션 사용
        const offer = await peerConnection.createOffer({ iceRestart: true });
        await peerConnection.setLocalDescription(offer);

        socketRef.current.emit('offer', {
          targetId: userId,
          offer: offer,
        });
      } else {
        // 상대방에게 재연결 요청
        socketRef.current.emit('reconnect-request', {
          targetId: userId,
        });
      }
    } catch (error) {
      console.error('ICE restart failed:', error);
    }
  };

  // Peer Connection 생성 함수
  const createPeerConnection = async (userId) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        {
          urls: `turn:${process.env.REACT_APP_TURN_IP}:3478`,
          username: 'songforyou',
          credential: `${process.env.REACT_APP_TURN_PASSWORD}`,
        },
      ],
      iceCandidatePoolSize: 10,
    });

    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === 'failed') {
        console.log('ice Connection failed, attempting reconnection...');
        restartICE(peerConnection, userId);
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);

      if (peerConnection.connectionState === 'disconnected') {
        // 재연결 대기
      } else if (peerConnection.connectionState === 'failed') {
        console.log('Connection failed, attempting reconnection...');
        restartICE(peerConnection, userId);
      } else if (peerConnection.connectionState === 'closed') {
        // 기존 코드
        delete peerConnectionsRef.current[userId];
        // 추가 정리
        peerConnection.close();
      }
    };

    // Caller로서 DataChannel 생성 (연결을 시작하는 쪽)
    if (!dataChannelsRef.current[userId]) {
      const dataChannel = peerConnection.createDataChannel(`dataChannel-${userId}`, {
        ordered: true,
        maxRetransmits: 3,
      });

      setupDataChannel(dataChannel, userId);
      dataChannelsRef.current[userId] = dataChannel;
    }
    // (Caller) 레이턴시 값 교환용 데이터채널 생성
    if (!latencyDataChannelsRef.current[userId]) {
      const dataChannel = peerConnection.createDataChannel(`latencyDataChannel-${userId}`, {
        ordered: true,
        maxRetransmits: 0,
      });

      dataChannel.onmessage = setupLatencyDataChannel;
      latencyDataChannelsRef.current[userId] = dataChannel;
    }

    // Callee로서 DataChannel 수신 대기 (연결을 받는 쪽)
    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      if (dataChannel.label.split('-')[0] === 'dataChannel') {
        setupDataChannel(dataChannel, userId);
        dataChannelsRef.current[userId] = dataChannel;
      } else if (dataChannel.label.split('-')[0] === 'latencyDataChannel') {
        dataChannel.onmessage = setupLatencyDataChannel;
        latencyDataChannelsRef.current[userId] = dataChannel;
      }
    };

    peerConnection.ontrack = (event) => {
      const audioElement = document.getElementById(`remoteAudio_${userId}`);
      if (audioElement && event.streams[0]) {
        audioElement.srcObject = event.streams[0];
        audioElement.volume = 0.5;
      }
      peerConnection.addEventListener('connectionstatechange', (event) => {
        console.log('Connection State:', peerConnection.connectionState);
      });

      peerConnection.addEventListener('iceconnectionstatechange', (event) => {
        console.log('ICE Connection State:', peerConnection.iceConnectionState);
      });
    };
    // 로컬 스트림 추가
    if (localStreamRef.current) {
      console.log('add local stream');
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionsRef.current[userId] = peerConnection;
    return peerConnection;
  };

  // 레이턴시 값 교환 데이터채널
  const setupLatencyDataChannel = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'listenerLatency') {
      singersDelay.current[data.singer] = data.setAs;

      let sum = 0;
      let i = 0;
      Object.keys(singersDelay.current).forEach((userId) => {
        if (micStatRef.current[userId] === true) {
          sum += singersDelay.current[userId];
          i++;
        }
      });
      if (i > 0) {
        setListenerNetworkDelay((old) => old * 0.7 + (sum / i) * 0.3);
      }
    }
  };
  // DataChannel 설정 함수
  const setupDataChannel = (dataChannel, targetId) => {
    dataChannel.addEventListener('open', (event) => {
      console.log(`connection with ${targetId} opened`);
    });

    dataChannel.addEventListener('close', (event) => {
      console.log(`connection with ${targetId} closed`);
    });

    dataChannel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      data.pitches.forEach((pitchData) => {
        if (!(data.id in pitchArraysRef.current) && entireReferDataRef.current.length > 0) {
          pitchArraysRef.current[data.id] = new Array(entireReferDataRef.current.length).fill(null);
        }
        pitchArraysRef.current[data.id][pitchData.index] = pitchData.pitch;
      });
      setPlayers((prevPlayers) => prevPlayers.map((player) => (player?.userId === data.id ? { ...player, score: data.score } : player)));
    };
  };

  // 이거 지우지 마세요
  useEffect(() => {
    const interval = setInterval(() => measureLatency(peerConnectionsRef, latencyCalcRef, micStatRef, singerNetworkDelay, setSingerNetworkDelay, listenerNetworkDelay, setListenerNetworkDelay, jitterDelay, setJitterDelay, latencyDataChannelsRef.current, socketId.current, RTTRef.current), 500);

    return () => clearInterval(interval);
  }, []);

  // 화면 비율 조정 감지
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight * 0.7,
        });
      }

      if (containerRef.current.offsetWidth < 1024) {
        const newDataPointCount = 25 + ((containerRef.current.offsetWidth - 300) / (1024 - 300)) * (75 - 25);
        setDataPointCount(Math.round(newDataPointCount));
      } else {
        setDataPointCount(75);
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 슬라이더 업데이트 함수
  useEffect(() => {
    // 슬라이더 진행도 업데이트 함수
    function updateSliderProgress(slider) {
      const max = slider.max;
      const value = slider.value;
      const percentage = (value / max) * 100;
      slider.style.backgroundSize = `${percentage}% 100%`;
    }

    // 슬라이더 요소 선택
    const slider = document.querySelector('.range-slider-play');
    if (slider) {
      updateSliderProgress(slider); // 초기 진행 상태 업데이트
      slider.addEventListener('input', () => updateSliderProgress(slider)); // 슬라이더 변경 시 업데이트
    }

    // Cleanup
    return () => {
      if (slider) {
        slider.removeEventListener('input', () => updateSliderProgress(slider));
      }
    };
  }, [playbackPosition]); // playbackPosition 변경 시마다 실행

  // 지연 시간 측정을 위해 서버에 ping 메시지 전송 함수
  const sendPing = () => {
    const sendTime = performance.now();
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
      setServerTimeDiff(estTimeDiff);
    } else {
      // 측정이 더 필요한 경우 최대횟수까지 서버에 ping 요청
      sendPing();
    }
  };

  // 시작 버튼 누르면 곡 시작하게 하는 부분.
  const handleStartClick = () => {
    // 서버에 시작 요청 보내기
    socketRef.current.emit('requestStartTimeWithDelay', {
      roomId: roomId,
      songId: currentData.songId,
    });
  };

  const handleStopClick = () => {
    socketRef.current.emit('requestStopMusic', {
      roomId: roomId,
    });
  };

  const handleVolumeChange = (event) => {
    setMusicGain(parseFloat(event.target.value));
  };

  const playerVolumeChange = (userId) => (event) => {
    const newVolume = parseFloat(event.target.value) / 100; // 0-100 값을 0-1로 변환

    // players state 업데이트
    setPlayers((prevPlayers) => prevPlayers.map((p) => (p.userId === userId ? { ...p, volume: parseInt(event.target.value) } : p)));

    // 실제 audio 엘리먼트의 볼륨 조절
    const audioElement = document.getElementById(`remoteAudio_${userId}`);
    if (audioElement) {
      audioElement.volume = newVolume;
    }
  };

  const OnPopup = () => {
    console.log(songLists);
    setshowPopup(true);
  };

  const closePopup = () => {
    setshowPopup(false);
  };

  useEffect(() => {
    if (useCorrection) {
      if (isMicOn) {
        setLatencyOffset(-audioDelay - singerNetworkDelay - optionDelay - playoutDelay);
      } else {
        setLatencyOffset(jitterDelay + listenerNetworkDelay);
      }
    } else {
      setLatencyOffset(0);
    }
  }, [audioDelay, singerNetworkDelay, optionDelay, jitterDelay, playoutDelay, listenerNetworkDelay, isMicOn, useCorrection]);

  usePitchDetection(localStreamRef.current, isPlaying, isMicOn, playbackPositionRef, setEntireGraphData, entireReferData, dataChannelsRef.current, setScore, setInstantScore, socketId.current);

  return (
    <PageTemplate isMobile={isMobile} isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} current={'multi'}>
      <div className='sing-area component-container-play' ref={containerRef}>
        <div className='information-area'>
          <p>
            <span>현재곡: </span>
            {`${reservedSongs[0] ? reservedSongs[0].title + ' - ' + reservedSongs[0].description : '없음'}`}
          </p>
          <p>
            <span>다음곡: </span>
            {`${reservedSongs[1] ? reservedSongs[1].title + ' - ' + reservedSongs[1].description : '없음'}`}
          </p>
        </div>

        <div className='pitch-graph-multi'>
          <PitchGraph dimensions={dimensions} realtimeData={entireGraphData} multiRealDatas={pitchArraysRef.current} referenceData={entireReferData} dataPointCount={dataPointCount} currentTimeIndex={playbackPosition * 40} songimageProps={reservedSongs[0]} score={instantScore} socketId={socketId.current} />
        </div>

        {/* 오디오 플레이어 컨트롤 */}
        <input className='range-slider-play' type='range' min='0' max={duration} step='0.025' value={playbackPositionRef.current} disabled={true} />

        {/* 현재 재생 중인 가사 출력 */}
        <div className='karaoke-lyrics'>
          <p className='prev-lyrics'>{prevLyric}</p>
          <NowPlayingLyrics segment={currSegment} playbackPosition={playbackPositionRef.current} />
          <p className='next-lyrics'>{nextLyric}</p>
        </div>

        {/* AudioPlayer 컴포넌트 */}
        <AudioPlayer ref={audioPlayerRef} isPlaying={isPlaying} setIsPlaying={setIsPlaying} audioBlob={mrDataBlob} setReservedSongs={setReservedSongs} setDuration={setDuration} onPlaybackPositionChange={setPlaybackPosition} starttime={starttime} setStarttime={setStarttime} setIsWaiting={setIsWaiting} setIsMicOn={setIsMicOn} latencyOffset={latencyOffset} musicGain={musicGain} playoutDelay={playoutDelay} setPlayoutDelay={setPlayoutDelay} socketRef={socketRef.current} currentData={currentData} roomId={roomId} setAudioLoaded={setAudioLoaded} />
      </div>

      <div className='players-chat'>
        <PlayerCard players={players} socketId={socketId} score={score} playerVolumeChange={playerVolumeChange} />

        <div className='button-area'>
          {/* 시작 버튼 */}
          <button onClick={isPlaying ? handleStopClick : handleStartClick} disabled={!audioLoaded || isWaiting} className={`button start-button ${!audioLoaded || isWaiting ? 'is-loading' : ''}`}>
            {audioLoaded ? (isPlaying ? '노래 멈추기' : '노래 시작') : '로딩 중...'}
          </button>

          {/* 마이크 토글 버튼 */}
          <button
            className={`button mic-button`} // 버튼 스타일 변경
            onClick={isMicOn ? micOff : micOn}>
            {isMicOn ? '마이크 끄기' : '마이크 켜기'}
          </button>

          <button className='button reservation-button' onClick={OnPopup}>
            예약하기
          </button>
          <div className='mr-section'>
            <li>Mr 소리 조절</li>
            <input type='range' className='range-slider' min={0} max={1} step={0.01} defaultValue={0.5} onChange={handleVolumeChange} aria-labelledby='volume-slider' />
          </div>

          <div className='remote-audios' style={{ display: 'none' }}>
            {players.map((player) => (
              <audio key={player.userId} id={`remoteAudio_${player.userId}`} autoPlay />
            ))}
          </div>

          {/* 조건부 렌더링 부분 popup */}
          {showPopup && <ReservationPopup roomid={roomId} socket={socketRef.current} onClose={closePopup} reservedSongs={reservedSongs} songLists={songLists} isPlaying={isPlaying} />}
        </div>

        <div className='chat-area'>
          <div className='messages'>
            {messages.map((msg, index) => (
              <div key={index} className='message'>
                <span className='text'>{msg.text}</span>
                <div className='time'>{new Date(msg.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className='input-area'>
            <input type='text' value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder='메시지를 입력하세요' />
            <button onClick={sendMessage}>
              <i className='fa-regular fa-paper-plane'></i>
            </button>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}

export default MultiPlay;
