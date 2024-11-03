
// 지연 시간 측정 함수
async function MeasureLatency(peerConnectionsRef, ref, micStatRef, networkDelay, setNetworkDelay, jitterDelay, setJitterDelay) {
  const values = {playout: [], jitter: []};

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
      if (report.type === 'inbound-rtp') {
        const newCount = report.jitterBufferEmittedCount; // cumulative
        const newDelay = report.jitterBufferTargetDelay; // cumulative
        const jitterDelay = (newDelay - data.jitter.delay) / (newCount - data.jitter.count) * 1000;

        if (jitterDelay > 0) {
          console.log(key, " JitterDelay: ", jitterDelay);
          values.jitter.push(jitterDelay);
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
    setJitterDelay(average(values.jitter));
  }
}

function average(arr) {
  if (arr.length === 0) return 0; // 빈 배열일 경우 예외 처리
  const sum = arr.reduce((acc, curr) => acc + curr, 0); // 배열 요소 합산
  return sum / arr.length; // 평균 계산
}

export default MeasureLatency;