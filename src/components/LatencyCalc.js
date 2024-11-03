import { rtt } from "three/webgpu";

// 지연 시간 측정 함수
async function MeasureLatency(peerConnectionsRef, ref, micStatRef, singerNetworkDelay, setSingerNetworkDelay, listenerNetworkDelay, setListenerNetworkDelay, jitterDelay, setJitterDelay, dataChannels, socketId) {
  const jitters = [];
  const RTTs = [];
  const listeners = [];

  for (let key in peerConnectionsRef.current) {
    const peerConnection = peerConnectionsRef.current[key];
    const stats = await peerConnection.getStats();
    if (!(key in ref.current)) ref.current[key] = {
      jitter: {count: 0, delay: 0, last: null},
    };
    const peerData = ref.current[key];

    // 마이크 켜져있는 사람과의 rtp 통계
    if (micStatRef.current[key] === true) {
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp') {
          const newCount = report.jitterBufferEmittedCount; // cumulative
          const newDelay = report.jitterBufferTargetDelay; // cumulative
          const jitterDelay = (newDelay - peerData.jitter.delay) / (newCount - peerData.jitter.count) * 1000;
          
          if (jitterDelay > 0) {
            console.log(key, " JitterDelay: ", jitterDelay);
            jitters.push(jitterDelay);
          }
          else if (report.type === 'media-source') {
            // console.log(report.totalAudioEnergy);
          }
        }
      });
    }
    // 마이크 꺼져있는 사람과의 rtp 통계
    else if (micStatRef.current[key] === false) {
      stats.forEach((report) => {
        // 상대방에게 가는 내 음성의 지연
        if (micStatRef.current[key] === false && report.type === 'remote-inbound-rtp' && report.kind === "audio") {
          const RTT = report.roundTripTime*1000;
          console.log(key, " inbound RTT: ", RTT);
          
          RTTs.push(RTT);
          listeners.push({userId: key, value: RTT});
        }
      });
    }
  }
  setJitterDelay(average(jitters));

  const singerDelay = Math.max(...RTTs);
  if (singerDelay > 0 ) {
    setSingerNetworkDelay(singerDelay);
    if (micStatRef.current[socketId]) {
      listeners.forEach((listener) => {
        const dataToSend = {
          type: "listenerLatency",
          singer: socketId,
          setAs: listener.value-singerDelay,
        };
        const channel = dataChannels[listener.userId];

        if (channel?.readyState === 'open') {
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