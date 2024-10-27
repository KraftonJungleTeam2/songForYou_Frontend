const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
// 룸별 클라이언트 지연시간을 저장할 객체
const roomLatencies = new Map();
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  // 룸 참가 처리
  socket.on('join-room', (roomName) => {
    socket.join(roomName);
    console.log(`Client ${socket.id} joined room: ${roomName}`);
    // 룸에 대한 초기 상태 설정
    if (!roomLatencies.has(roomName)) {
      roomLatencies.set(roomName, new Map());
    }
    // 현재 룸의 참가자 수를 클라이언트에게 전송
    const roomSize = io.sockets.adapter.rooms.get(roomName)?.size || 0;
    io.to(roomName).emit('room-update', {
      participantCount: roomSize,
      roomName
    });
  });
  // 지연시간 측정 시작 요청 처리
  socket.on('start-latency-check', (roomName) => {
    console.log(`Starting latency check for room: ${roomName}`);
    // 해당 룸의 모든 클라이언트에게 체크 시작 알림
    io.to(roomName).emit('prepare-latency-check', { timestamp: Date.now() });
  });
  // 지연시간 측정 요청 처리
  socket.on('latency-check', (roomName) => {
    io.to(roomName).emit('check-latency', { timestamp: Date.now() });
  })
  // 클라이언트로부터 지연시간 응답 수신
  socket.on('latency-result', ({ roomName, latency }) => {
    const roomData = roomLatencies.get(roomName);
    if (roomData) {
      roomData.set(socket.id, latency);
      // 모든 클라이언트가 응답했는지 확인
      const room = io.sockets.adapter.rooms.get(roomName);
      if (room && roomData.size >= room.size) {
        // 모든 결과를 클라이언트들에게 전송
        const results = Array.from(roomData.entries()).map(([clientId, latency]) => ({
          clientId,
          latency
        }));
        io.to(roomName).emit('all-latency-results', results);
        roomData.clear(); // 결과 초기화
      }
    }
  });
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});