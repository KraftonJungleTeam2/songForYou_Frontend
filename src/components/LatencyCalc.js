
// 지연 시간 측정 함수
async function MeasureLatency(peerConnectionsRef, samples, delay, state) {

  for (let key in peerConnectionsRef.current) {
    const peerConnection = peerConnectionsRef.current[key];
    const stats = await peerConnection.getStats();
    
    stats.forEach((report) => {
      // console.log(report.type, report);
      if (report.type === 'media-playout') {
        const newSamples = report.totalSamplesCount;
        const newDelay = report.totalPlayoutDelay;
        const playoutDelay = (newDelay - delay.current) / (newSamples - samples.current) * 1000;

        if (playoutDelay > 0)
          console.log("playoutDelay: ", playoutDelay);
        samples.current = newSamples;
        delay.current = newDelay;
      }
      if (report.type === 'inbound-rtp') {
        console.log("mean jitterBufferDelay: ", report.jitterBufferDelay/report.jitterBufferEmittedCount);
        console.log("mean jitterBufferMinimumDelay: ", report.jitterBufferMinimumDelay/report.jitterBufferEmittedCount);
        console.log("mean jitterDelay: ", report.jitterBufferTargetDelay/report.jitterBufferEmittedCount);
      }
      // if (report.type === 'media-source') {
        //   console.log(report.totalAudioEnergy);
        // }
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        console.log("RTT: ", report.currentRoundTripTime);
      }
    });
  }
}

export default MeasureLatency;