import { useState, useEffect, useRef } from 'react';

import { PitchDetector } from 'pitchy';
import { setupAudioContext, calculateRMS } from '../utils/AudioUtils';

export const usePitchDetection = () => {
  const [pitch, setPitch] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [decibel, setDecibel] = useState(-Infinity);
  const [graphData, setGraphData] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const detectorRef = useRef(null);
  const pitchRef = useRef(pitch);

  const MAX_ALLOWED_OCTAVE_DIFFERENCE = Infinity;
  const graphMaxDatapoint = 100;

  useEffect(() => {
    pitchRef.current = pitch;
  }, [pitch]);

  useEffect(() => {
    async function setupAudio() {
      try {
        const { audioContext, analyser, source } = await setupAudioContext();
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceRef.current = source;

        const bufferLength = analyserRef.current.fftSize;
        detectorRef.current = PitchDetector.forFloat32Array(bufferLength);
        const input = new Float32Array(bufferLength);

        setStartTime(Date.now());

        function updatePitch() {
          analyserRef.current.getFloatTimeDomainData(input);
          const rms = calculateRMS(input);
          const newDecibel = 20 * Math.log10(rms);
          setDecibel(newDecibel);

          const currentTime = (Date.now() - startTime) / 1000;

          if (newDecibel > -40) {
            const [pitchResult, clarityResult] = detectorRef.current.findPitch(input, audioContextRef.current.sampleRate);

            if (clarityResult > 0.85 && pitchResult > 40) {
              let correctedPitch = pitchResult;

              function getOctaveDifference(freq1, freq2) {
                if (freq1 <= 0 || freq2 <= 0) return Infinity;
                return Math.abs(Math.log2(freq1 / freq2));
              }

              if (pitchRef.current !== 0 && getOctaveDifference(pitchResult, pitchRef.current) <= MAX_ALLOWED_OCTAVE_DIFFERENCE) {
                correctedPitch = pitchRef.current * 0.5 + correctedPitch * 0.5;
              } else if (pitchRef.current !== 0) {
                correctedPitch = pitchRef.current;
              }

              const MIN_VALID_PITCH = 20;
              const MAX_VALID_PITCH = 20000;
              if (correctedPitch >= MIN_VALID_PITCH && correctedPitch <= MAX_VALID_PITCH) {
                setPitch(correctedPitch);
                setClarity(clarityResult);
                setGraphData(prevData => [...prevData, { time: currentTime, pitch: correctedPitch }].slice(-graphMaxDatapoint));
              } else {
                setPitch(0);
                setClarity(0);
                setGraphData(prevData => [...prevData, { time: currentTime, pitch: null }].slice(-graphMaxDatapoint));
              }
            } else {
              setPitch(0);
              setClarity(0);
              setGraphData(prevData => [...prevData, { time: currentTime, pitch: null }].slice(-graphMaxDatapoint));
            }
          } else {
            setPitch(0);
            setClarity(0);
            setGraphData(prevData => [...prevData, { time: currentTime, pitch: null }].slice(-graphMaxDatapoint));
          }

        //   requestAnimationFrame(updatePitch);  // 다음 프레임 요청
        }
        // updatePitch();  // 최초 실행
        const intervalId = setInterval(updatePitch, 50);

        return () => {
          clearInterval(intervalId);
          if (sourceRef.current) {
            sourceRef.current.disconnect();
          }
          if (audioContextRef.current) {
            audioContextRef.current.close();
          }
        };
      } catch (error) {
        console.error('Error accessing the microphone', error);
      }
    }

    setupAudio();
  }, []);

  return { pitch, clarity, decibel, graphData };
};