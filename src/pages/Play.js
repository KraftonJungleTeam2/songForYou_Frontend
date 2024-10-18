import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { usePitchDetection } from '../components/usePitchDetection';
import { getNote } from '../utils/NoteUtils';
import PitchGraph from '../components/PitchGraph';


function linearInterpolation(a, b, t) {
    return a + (b - a) * t;
  }
  
  function generatePitchData(currentTime, delayDuration = 4, dataDuration = 10, interval = 50) {
    const delaySamples = Math.floor(delayDuration * 1000 / interval);
    const dataSamples = Math.floor(dataDuration * 1000 / interval);
    const totalSamples = delaySamples + dataSamples;
    
    const frequencies = [32.70, 65.41, 130.81, 261.63, 523.25, 1046.50, 2093.00, 4186.01];
    
    if (currentTime < delaySamples) {
      return { time: currentTime * interval, pitch: null };
    } else {
      const t = ((currentTime - delaySamples) * interval) / (dataDuration * 1000); // 0에서 1 사이의 값
      
      const octaveIndex = Math.floor(t * 7); 
      const octaveFraction = (t * 7) % 1;
      
      const lowerFreq = frequencies[octaveIndex];
      const upperFreq = frequencies[Math.min(octaveIndex + 1, 7)];
      const interpolatedFreq = linearInterpolation(lowerFreq, upperFreq, octaveFraction);
      
      const smoothness = Math.sin(t * Math.PI * 2) * 0.1; 
      const pitch = interpolatedFreq * (1 + smoothness);
      
      return { time: currentTime * interval, pitch };
    }
  }
  
  function updateReferData(prevData, currentTime, delayDuration = 4, dataDuration = 10, interval = 50) {
    if (!Array.isArray(prevData)) prevData = []; // Ensure prevData is an array
    const newPitchData = generatePitchData(currentTime, delayDuration, dataDuration, interval);
    return [...prevData, newPitchData].slice(-280);
  }
  
  let refer = [];
  let currentTime = 0;
  
  const intervalId = setInterval(() => {
    refer = updateReferData(refer, currentTime);
    if (refer.length > 0) {
      console.log(refer[refer.length - 1]); 
    }
    
    currentTime++; // Increment by 1, assuming each iteration is 50ms apart
    
    if (currentTime * 25 >= 20000) { // 14초(14000ms) 후 종료
      clearInterval(intervalId);
    }
  }, 25);



const Play = () => {
  const { id } = useParams();
  const [dimensions, setDimensions] = useState({ width: 0, height: 600 });
  const containerRef = useRef(null);

  const { pitch, clarity, decibel, graphData} = usePitchDetection();

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 500
        });
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden" ref={containerRef}>
        <h1 className="text-2xl font-bold mb-4 text-center p-4">Pitch Detector</h1>
        <div className="flex flex-col">
          <div className="p-4 bg-gray-50 flex justify-around">
            <p className="text-lg"><span className="font-semibold">Pitch:</span> {pitch.toFixed(2)} Hz ({getNote(pitch)})</p>
            <p className="text-lg"><span className="font-semibold">Clarity:</span> {(clarity * 100).toFixed(2)}%</p>
            <p className="text-lg"><span className="font-semibold">Decibel:</span> {decibel.toFixed(2)} dB</p>
          </div>
          <div className="p-4">
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <PitchGraph dimensions={dimensions} referenceData={refer} realtimeData={graphData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Play;