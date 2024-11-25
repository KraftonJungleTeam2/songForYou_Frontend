// 지연 시간 측정 함수
async function MeasureLatency(
  peerConnectionsRef,
  ref,
  micStatRef,
  singerNetworkDelay,
  setSingerNetworkDelay,
  listenerNetworkDelay,
  setListenerNetworkDelay,
  jitterDelay,
  setJitterDelay,
  dataChannels,
  socketId,
  RTTRef,
  setRealJitterDelay,
) {
  const jitters = [];
  const realjitters = [];
  const RTTs = [];
  const listeners = [];

  for (let key in peerConnectionsRef.current) {
    const peerConnection = peerConnectionsRef.current[key];
    const stats = await peerConnection.getStats();
    if (!(key in ref.current))
      ref.current[key] = {
        jitter: { count: 0, delay: 0, real:0, last: null },
      };
    const peerData = ref.current[key];
    if (!RTTRef.key) RTTRef.key = [];

    // 마이크 켜져있는 사람과의 rtp 통계
    if (micStatRef.current[key] === true) {
      stats.forEach((report) => {
        if (report.type === "inbound-rtp") {
          const newCount = report.jitterBufferEmittedCount; // cumulative
          const newDelay = report.jitterBufferTargetDelay; // cumulative
          const newRealDelay = report.jitterBufferDelay; // cumulative
          const jitterDelay =
            ((newDelay - peerData.jitter.delay) /
              (newCount - peerData.jitter.count)) *
            1000;
          const realJitterDelay = 
            ((newRealDelay - peerData.jitter.delay) /
              (newCount - peerData.jitter.count)) *
            1000;

          if (jitterDelay > 0) {
            // console.log(key, " JitterDelay: ", jitterDelay);
            jitters.push(jitterDelay);
            realjitters.push(realJitterDelay);
          } else if (report.type === "media-source") {
            // console.log(report.totalAudioEnergy);
          }
        }
      });
    }
    // 마이크 꺼져있는 사람과의 rtp 통계
    else if (micStatRef.current[key] === false) {
      stats.forEach((report) => {
        // 상대방에게 가는 내 음성의 지연
        if (report.type === "remote-inbound-rtp" && report.kind === "audio") {
          let RTT = report.roundTripTime * 1000;
          if (RTT >= 0) {
            if (RTTRef.key.length > 0) {
              const max = Math.max(...RTTRef.key);
              if (RTT > max + 500) {// 이 함수 interval보다 길면 제한
                RTT = max+500;
                RTTRef.key.push(RTT);
                if (RTTRef.key.length > 5) RTTRef.key.shift();
                return;
              }
            }
            RTTRef.key.push(RTT);
            if (RTTRef.key.length > 5) RTTRef.key.shift();

            RTT = Math.min(...RTTRef.key);
            // console.log(key, "의 RTTs: ", RTTRef.key.slice(), "선택된 RTT: ", RTT);
            RTTs.push(RTT);
            listeners.push({ userId: key, value: RTT });
          }
        }
      });
    }
  }

  const avgJitter = average(jitters);
  if (jitters > 0)
    setJitterDelay(Math.floor(avgJitter));
  setRealJitterDelay(Math.floor(average(realjitters)));
  
  const singerDelay = average(RTTs);
  if (singerDelay > 0) {
    const newSingerDelay = singerNetworkDelay * 0.5 + singerDelay * 0.5;
    setSingerNetworkDelay(Math.floor(newSingerDelay));
    if (micStatRef.current[socketId]) {
      listeners.forEach((listener) => {
        const dataToSend = {
          type: "listenerLatency",
          singer: socketId,
          setAs: (listener.value - singerDelay),
        };
        const channel = dataChannels[listener.userId];

        if (channel?.readyState === "open") {
          channel.send(JSON.stringify(dataToSend));
        }
      });
    }
  }
}

function average(arr) {
  if (arr.length === 0) return 0; // 빈 배열일 경우 예외 처리
  const sum = arr.reduce((acc, curr) => acc + curr, 0); // 배열 요소 합산
  return sum / arr.length; // 평균 계산
}

export default MeasureLatency;
