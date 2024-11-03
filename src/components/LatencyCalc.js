
// 지연 시간 측정 함수
async function MeasureLatency(peerConnectionsRef, ref, micStatRef, networkDelay, setNetworkDelay, jitterDelay, setJitterDelay, playoutDelay, setPlayoutDelay) {
  const counter = {playout: 0, jitter: 0, }
  for (let key in peerConnectionsRef.current) {
    // 마이크 꺼져있는 사용자는 고려 x
    if (micStatRef.current[key] == undefined || micStatRef.current[key] === false) continue;

    const peerConnection = peerConnectionsRef.current[key];
    const stats = await peerConnection.getStats();
    if (!(key in ref.current)) ref.current[key] = {
      playout: {count: 0, delay: 0, last: null},
      jitter: {count: 0, delay: 0, last: null},
    };
    const data = ref.current[key];

    stats.forEach((report) => {
      if (report.type === 'media-playout') {
        const newCount = report.totalSamplesCount; // cumulative
        const newDelay = report.totalPlayoutDelay; // cumulative
        const playoutDelay = (newDelay - data.playout.delay) / (newCount - data.playout.count) * 1000;
        data.playout.count = newCount;
        data.playout.delay = newDelay;
      
        if (playoutDelay > 0) {// 유효한 값이면
          console.log(key, " playoutDelay: ", playoutDelay);
          setPlayoutDelay(playoutDelay);
        }
      }
      else if (report.type === 'inbound-rtp') {
        const newCount = report.jitterBufferEmittedCount; // cumulative
        const newDelay = report.jitterBufferTargetDelay; // cumulative
        const jitterDelay = (newDelay - data.jitter.delay) / (newCount - data.jitter.count) * 1000;

        if (jitterDelay > 0) {
          console.log(key, " JitterDelay: ", jitterDelay);
          setJitterDelay(jitterDelay);
        }
      }
      else if (report.type === 'remote-inbound-rtp' && report.kind === "audio") {
        // 상대방에게 가는 내 음성의 지연
        console.log(key, " inbound RTT: ", report.roundTripTime*1000);
      }
      else if (report.type === 'media-source') {
        // console.log(report.totalAudioEnergy);
      }
      else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        console.log(report.type, report);
        console.log(key, " RTT: ", report.currentRoundTripTime * 1000);
      }
    });
  }
}

export default MeasureLatency;