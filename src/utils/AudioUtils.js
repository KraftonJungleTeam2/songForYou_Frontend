export const setupAudioContext = async (stream) => {
  // const stream = await navigator.mediaDevices.getUserMedia({
  //   audio: {
  //     echoCancellation: true,
  //     noiseSuppression: true,
  //     autoGainControl: false,
  //   },
  // });
  // console.log(stream);
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  // 스트림 중지 함수
  const stopStream = () => {
    stream.getTracks().forEach((track) => track.stop());
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }
  };
  return { audioContext, analyser, source, stopStream, stream };
};

export const calculateRMS = (buffer) => {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
};
