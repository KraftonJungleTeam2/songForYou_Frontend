import io from 'socket.io-client';

const socket = io('http://yourserver.com'); // 서버 URL
const peerConnections = {}; // 각 피어에 대해 개별 연결 생성
let localStream; // 마이크 스트림을 저장할 변수

// 마이크 스트림 얻기
const getLocalStream = async () => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (error) {
    console.error('마이크 스트림 오류:', error);
  }
};

// 피어 연결 생성 및 관리 함수
const createPeerConnection = (peerId) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });

  // 로컬 스트림 추가
  localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

  // ICE 후보 생성 시 서버로 전송
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { candidate: event.candidate, to: peerId });
    }
  };

  // 상대방의 스트림을 오디오 태그에 연결
  peerConnection.ontrack = (event) => {
    const remoteStream = event.streams[0];
    document.getElementById(`remoteAudio_${peerId}`).srcObject = remoteStream;
  };

  peerConnections[peerId] = peerConnection;
  return peerConnection;
};

// 서버에서 offer 수신 시 answer 생성 후 전송
socket.on('offer', async ({ offer, from }) => {
  const peerConnection = createPeerConnection(from);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', { answer, to: from });
});

// 서버에서 answer 수신 시 설정
socket.on('answer', async ({ answer, from }) => {
  const peerConnection = peerConnections[from];
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// 서버에서 ICE 후보 수신 시 설정
socket.on('ice-candidate', async ({ candidate, from }) => {
  const peerConnection = peerConnections[from];
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// 방에 입장
socket.emit('join-room', roomId); // 방 입장

// 방에 있는 기존 사용자 정보 수신 후 offer 전송
socket.on('existing-users', async (users) => {
  await getLocalStream(); // 마이크 스트림 준비

  users.forEach(async (userId) => {
    const peerConnection = createPeerConnection(userId);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { offer, to: userId });
  });
});
