
// 지연 시간 측정 함수
async function MeasureLatency(peerConnectionsRef, ref, micStatRef, networkDelay, jitterDelay, playoutdelay) {
  const data = ref.current;

  for (let key in peerConnectionsRef.current) {
    // 마이크 꺼져있는 사용자는 고려 x
    if (micStatRef.current[key] == undefined || micStatRef.current[key] === false) return;
    const peerConnection = peerConnectionsRef.current[key];
    const stats = await peerConnection.getStats();

    stats.forEach((report) => {
      // console.log(report.type, report);
      // if (report.type === 'media-playout') {
      //   const newSamples = report.totalSamplesCount;
      //   const newDelay = report.totalPlayoutDelay;
      //   const playoutDelay = (newDelay - data.playout.delay) / (newSamples - data.playout.samples) * 1000;
      //   data.playout.samples = newSamples;
      //   data.playout.delay = newDelay;

      //   if (playoutDelay > 0) {// 유효한 값이면
      //     console.log("playoutDelay: ", playoutDelay);
      //     setPlayoutDelay(playoutDelay)
      //   }
      // }
      if (report.type === 'inbound-rtp') {
        console.log("mean jitterDelay: ", report.jitterBufferTargetDelay / report.jitterBufferEmittedCount);
      }
      if (report.type === 'remote-inbound-rtp') {
        console.log("ID:", key, "RTT is", report.roundTripTime*1000);
      }
      if (report.type === 'media-source') {
        // console.log(report.totalAudioEnergy);
      }
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        console.log("RTT: ", report.currentRoundTripTime);
      }
    });
  }
}

export default MeasureLatency;