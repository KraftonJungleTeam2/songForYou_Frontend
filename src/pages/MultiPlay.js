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

import { stringToColor } from '../utils/GraphUtils';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  const [currentLyric, setCurrentLyric] = useState(' ');
  const [nextLyric, setNextLyric] = useState(' ');

  const [duration, setDuration] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const playbackPositionRef = useRef(playbackPosition);
  playbackPositionRef.current = playbackPosition;

  //데이터 로딩되었는지 확인하는거
  const [pitchLoaded, setPitchLoaded] = useState(false);
  const [lyricsLoaded, setLyricsLoaded] = useState(false);

  const [mrDataBlob, setMrDataBlob] = useState(null);
  const [lyricsData, setLyricsData] = useState(null);

  // 예약 popup에서 작업하는 부분
  const [reservedSongs, setReservedSongs] = useState([]); // 예약된 곡 ID 리스트
  const [currentData, setcurrentData] = useState(null);
  const [nextData, setnextData] = useState(null);
  const currentDataRef = useRef(currentData);
  const nextDataRef = useRef(nextData);
  currentDataRef.current = currentData;
  nextDataRef.current = nextData;

  const [audioLoaded, setAudioLoaded] = useState(false);
  const audioLoadedRef = useRef(audioLoaded);
  audioLoadedRef.current = audioLoaded;

  // 버튼 끄게 하는 state
  const [isWaiting, setIsWaiting] = useState(true);
  //
  const audioPlayerRef = useRef();
  // 지연시간 ping을 위한 state
  const serverTimeDiff = useRef(null);

  //오디오 조절을 위한 state
  const [starttime, setStarttime] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showPopup, setshowPopup] = useState(false); // 예약 팝업 띄우는 state

  //웹소켓 부분
  const timeDiffSamplesRef = useRef([]); // 지연 시간 측정을 위한 배열

  //화면 조정을 위한 state들
  const [dimensions, setDimensions] = useState({ width: 100, height: 600 });
  const containerRef = useRef(null);

  // 서버에서 데이터 로딩 후 배열 생성
  const [entireGraphData, setEntireGraphData] = useState([]);
  const [entireReferData, setEntireReferData] = useState([]);

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

  // latencyCalc.js에서 사용
  const latencyCalcRef = useRef({});

  // 볼륨 조절 용. 0.0-1.0의 값
  const [musicGain, setMusicGain] = useState(1);

  useEffect(() => {
    if(reservedSongs.length === 0){
      setEntireGraphData([]);
      setEntireReferData([]);
      setLyricsData(null);
    }
  }, [reservedSongs])

  useEffect(() => {
    currentDataRef.current = currentData;
    nextDataRef.current = nextData;
    console.log('use', currentDataRef.current);
    console.log('use', nextDataRef.current);
  }, [currentData, nextData]);

  useEffect(() => {
    audioLoadedRef.current = audioLoaded;
    if (!audioLoadedRef.current) {
      if (currentDataRef.current) {
        loadData(currentDataRef.current);
      }
      setReservedSongs((prev) => prev.slice(1));

      console.log('노래끝', currentDataRef.current);
      console.log('노래끝', nextDataRef.current);
    }
  }, [audioLoaded]);

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
    fetchSongLists();
  }, []);

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

  // loadaudio 함수 정의
  const loadData = async (data) => {
    try {
      // fileBlob을 URL로 받는다면 해당 URL을 이용하여 blob으로 변환
      const fileUrl = data.mrUrl;
      if (fileUrl) {
        const fileResponse = await fetch(fileUrl);
        const fileBlob = fileResponse;
        setMrDataBlob(fileBlob); // Blob 데이터 저장
      } else {
        console.error('Error: file URL not found in the response');
      }

      // 받아진 데이터가 array임 이미 해당 배열 pitch그래프에 기입
      const pitchArray = data.pitch;

      if (Array.isArray(pitchArray)) {
        try {
          const processedPitchArray = doubleDataFrequency(pitchArray);

          setEntireReferData(processedPitchArray);

          setEntireGraphData(new Array(processedPitchArray.length).fill(null));

          pitchArraysRef.current['myId'] = socketId.current;

          Object.keys(dataChannelsRef.current).forEach(key => {
            pitchArraysRef.current[key] = new Array(processedPitchArray.length).fill(null);
          });
          setPitchLoaded(true);
        } catch (error) {
          console.error('Error processing pitch data:', error);
        }
      } else {
        console.error('Error: Expected pitch data to be an array');
      }

      // 가사 데이터 업로드
      setLyricsData(data.lyrics);
      setLyricsLoaded(true);
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
    console.log('update mic of', userId);
    setPlayers((prevPlayers) => prevPlayers.map((player) => (player?.userId === userId ? { ...player, mic: micBool } : player)));
    micStatRef.current[userId] = micBool;
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
      const audioElement = document.getElementById('localAudio');
      if (audioElement) {
        audioElement.srcObject = stream;
      }

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

      const response = await axios.get(`${process.env.REACT_APP_API_ENDPOINT}/users/info`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const nickname = response.data.name;
      await socketRef.current.emit('joinRoom', {
        roomId: roomId,
        nickname: nickname,
        mic: isMicOn,
      });
      // 연결되면 바로 서버시간 측정
      timeDiffSamplesRef.current = []; // 초기화
      sendPing(); // 첫 번째 ping 전송
    });

    socketRef.current.on('error', (message) => {
      navigate('/multi');
    });
    socketRef.current.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Room 이벤트 핸들러
    socketRef.current.on('joinedRoom', ({ roomId, roomInfo, userId }) => {
      const users = roomInfo.users;
      socketId.current = userId;
      users.forEach((user) => {
        addPlayer(user.nickname, user.id, user.mic);
      });
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
      await peerConnection.setRemoteDescription(offer);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice-candidate', {
            targetId: callerId,
            candidate: event.candidate,
          });
        }
      };
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

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice-candidate', {
            targetId: callerId,
            candidate: event.candidate,
          });
        }
      };
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    });

    // ICE candidate 처리
    socketRef.current.on('ice-candidate', async ({ candidate, callerId }) => {
      const peerConnection = peerConnectionsRef.current[callerId];
      if (peerConnection) {
        console.log('- yes');
        console.log(candidate);
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch((error) => console.error('Error adding received ICE candidate:', error));
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
      const nextman = nextDataRef.current;
      setcurrentData(nextman);
      setnextData(null);
      
      setIsWaiting(true);

      // 이미 구해진 지연시간을 가지고 클라이언트에서 시작되어야할 시간을 구함.
      const serverStartTime = data.startTime;
      const clientStartTime = serverStartTime + serverTimeDiff.current;

      // 클라이언트 시작시간을 starttime으로 정하면 audio내에서 delay 작동 시작
      setStarttime(clientStartTime);
      micOff();
    });

    socketRef.current.on('stopMusic', (data) => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.stopAudio(); // handleStopAudio 함수를 호출
      }
    });

    // 웹 소켓으로 데이터 받는 부분 (마운트 작업) #############################################
    socketRef.current.on('reservedData', (data) => {
      try {
        if (currentDataRef.current === null) {
          setcurrentData(data);
          if (!audioLoadedRef.current) {
            loadData(data);
          }
          console.log('소켓 수신 데이터 current', currentDataRef.current);
          console.log('소켓 수신 데이터 current', nextDataRef.current);
        } else {
          if (nextDataRef.current === null) {
            setnextData(data);
            console.log('소켓 수신 데이터 next', currentDataRef.current);
            console.log('소켓 수신 데이터 next', nextDataRef.current);
          } else {
            console.log('데이터 저장 용량 2개 꽉참 ㅅㄱ');
          }
        }
      } catch (error) {
        console.error('Error processing download playsong data:', error);
      }
    });

    socketRef.current.on('songAdded', (data) => {
      try {
        setReservedSongs((prev) => [...prev, data.songdata]);
      } catch (error) {
        console.error('Error processing download playsong data:', error);
      }
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
    } catch (error) {
      console.error('Error in micOff:', error);
    }
  };
  // Peer Connection 생성 함수
  const createPeerConnection = async (userId) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);

      if (peerConnection.connectionState === 'disconnected') {
        // 재연결 대기
      } else if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
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

    // Callee로서 DataChannel 수신 대기 (연결을 받는 쪽)
    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      setupDataChannel(dataChannel, userId);
      dataChannelsRef.current[userId] = dataChannel;
    };


    // 레이턴시 값 교환 데이터채널
    const setupLatencyDataChannel = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "listenerLatency") {
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
          setListenerNetworkDelay(sum/i);
          console.log("setlistener lat");
        }
      }
    };
    // Caller 레이턴시 값 교환용 데이터채널 생성
    if (!latencyDataChannelsRef.current[userId]) {
      const dataChannel = peerConnection.createDataChannel(`latencyDataChannel-${userId}`, {
        ordered: true,
        maxRetransmits: 0,
      });

      dataChannel.onmessage = setupLatencyDataChannel;
      latencyDataChannelsRef.current[userId] = dataChannel;
    }
    // Callee 레이턴시 값 교환용 데이터채널 수신
    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      dataChannel.onmessage = setupLatencyDataChannel;
      latencyDataChannelsRef.current[userId] = dataChannel;
    };

    peerConnection.ontrack = (event) => {
      const audioElement = document.getElementById(`remoteAudio_${userId}`);
      if (audioElement && event.streams[0]) {
        audioElement.srcObject = event.streams[0];
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
        pitchArraysRef.current[data.id][pitchData.index] = pitchData.pitch;
      });
    };
  };

  // 이거 지우지 마세요
  useEffect(() => {
    const interval = setInterval(() => measureLatency(peerConnectionsRef, latencyCalcRef, micStatRef, singerNetworkDelay, setSingerNetworkDelay, listenerNetworkDelay, setListenerNetworkDelay, jitterDelay, setJitterDelay, latencyDataChannelsRef.current, socketId.current), 1000);

    return () => clearInterval(interval);
  }, []);

  // 화면 비율 조정 감지
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight * 0.5,
        });
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      serverTimeDiff.current = estTimeDiff;
      setIsWaiting(false);
    } else {
      // 측정이 더 필요한 경우 최대횟수까지 서버에 ping 요청
      sendPing();
    }
  };

  // 시작 버튼 누르면 곡 시작하게 하는 부분.
  const handleStartClick = () => {
    if (!audioLoaded) {
      alert('오디오가 아직 로딩되지 않았습니다.');
      setIsWaiting(false);
      return;
    }
    // 서버에 시작 요청 보내기
    socketRef.current.emit('requestStartTimeWithDelay', {
      roomId: roomId,
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

  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  const OnPopup = () => {
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

  usePitchDetection(localStreamRef.current, isPlaying, isMicOn, playbackPositionRef, setEntireGraphData, dataChannelsRef.current, socketId.current);

  return (
    <div className='multiPlay-page'>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`multi-content ${isSidebarOpen ? 'shifted' : ''}`} style={{ flexGrow: 1 }}>
        <TopBar className='top-bar' />
        <div className={'multi-content-area'}>
          <div className='players-chat'>
            <div className='players'>
              {Array(4)
                .fill(null)
                .map((_, index) => (
                  <div
                    key={index}
                    className={`player-card ${players[index]?.isAudioActive ? 'active' : ''}`}
                    style={players[index] ? { backgroundColor: stringToColor(players[index].userId) } : {}}
                  >
                    {players[index] ? (
                      <div>
                        <p>{players[index].name} {players[index].mic ? '🎤' : '  '}</p>
                      </div>
                    ) : (
                      <p>빈 자리</p>
                    )}
                  </div>
                ))}
            </div>
            <div className='chat-area'>
              {' '}
              <div className='chat-container'>
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
                  <input type='text' value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder='메시지를 입력하세요...' />
                  <button onClick={sendMessage}>전송</button>
                </div>
              </div>
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

            <div className='pitch-graph-multi'>
              <PitchGraph dimensions={dimensions} realtimeData={entireGraphData} multiRealDatas={pitchArraysRef.current} referenceData={entireReferData} dataPointCount={dataPointCount} currentTimeIndex={playbackPosition * 40} songimageProps={reservedSongs[0]} />
            </div>

            {/* Seek Bar */}
            {/* <div className='seek-bar-container'>
            <input type='range' min='0' max={duration} step='0.025' value={playbackPosition} className='range-slider' disabled={!audioLoaded} />
            <div className='playback-info'>
              {playbackPosition.toFixed(3)} / {duration.toFixed(2)} 초
            </div>
          </div> */}

            {/* 현재 재생 중인 가사 출력 */}
            <div className='karaoke-lyrics'>
              <p className='prev-lyrics'>{prevLyric}</p>
              <p className='curr-lyrics'>{currentLyric}</p>
              <p className='next-lyrics'>{nextLyric}</p>
            </div>

            <div className='button-area'>
              {/* 시작 버튼 */}
              <button onClick={isPlaying ? handleStopClick : handleStartClick} disabled={!audioLoaded || isWaiting || !pitchLoaded || !lyricsLoaded} className={`button start-button ${!audioLoaded || isWaiting ? 'is-loading' : ''}`}>
                {audioLoaded ? (isPlaying ? '노래 멈추기' : '노래 시작') : '로딩 중...'}
              </button>

              {/* 마이크 토글 버튼 */}
              <button
                className={`button mic-button`} // 버튼 스타일 변경
                onClick={isMicOn ? micOff : micOn}>
                {isMicOn ? '마이크 끄기' : '마이크 켜기'}
              </button>

              <button className='button reservation-button' onClick={OnPopup}>
                시작하기 or 예약하기
              </button>
              <button className='button' onClick={() => setUseCorrection(!useCorrection)}>
                {useCorrection ? '보정끄기' : '보정켜기'}
              </button>
              <input type='range' className='range-slider' min={0} max={1} step={0.01} defaultValue={1} onChange={handleVolumeChange} aria-labelledby='volume-slider' />
              <h3>DEBUG playoutDelay: {playoutDelay.toFixed(2)}, jitterDelay: {jitterDelay.toFixed(2)}, listenerNetworkDelay: {listenerNetworkDelay.toFixed(2)}</h3>
              <h3>audioDelay: {audioDelay.toFixed(2)}, singerNetworkDelay: {singerNetworkDelay.toFixed(2)}, optionDelay: {optionDelay.toFixed(2)}</h3>
              <h3>latencyOffset: {latencyOffset.toFixed(2)}</h3>
              <input type='number' value={optionDelay} onChange={(e) => setOptionDelay(parseFloat(e.target.value))}></input>
              {/* 오디오 엘리먼트들 */}
              <audio id='localAudio' autoPlay muted />
              <div className='remote-audios' style={{ display: 'none' }}>
                {players.map((player) => (
                  <audio key={player.userId} id={`remoteAudio_${player.userId}`} autoPlay />
                ))}
              </div>
            </div>

            {/* 조건부 렌더링 부분 popup */}
            {showPopup && <ReservationPopup roomid={roomId} socket={socketRef.current} onClose={closePopup} reservedSongs={reservedSongs} setReservedSongs={setReservedSongs} songLists={songLists} nextData={nextDataRef.current} />}

            {/* AudioPlayer 컴포넌트 */}
            <AudioPlayer ref={audioPlayerRef} isPlaying={isPlaying} setIsPlaying={setIsPlaying} audioBlob={mrDataBlob} setAudioLoaded={setAudioLoaded} setDuration={setDuration} onPlaybackPositionChange={setPlaybackPosition} starttime={starttime} setStarttime={setStarttime} setIsWaiting={setIsWaiting} setIsMicOn={setIsMicOn} latencyOffset={latencyOffset} musicGain={musicGain} playoutDelay={playoutDelay} setPlayoutDelay={setPlayoutDelay} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MultiPlay;
