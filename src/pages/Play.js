import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { usePitchDetection } from '../components/usePitchDetection';
import { getNote } from '../utils/NoteUtils';
import PitchGraph from '../components/PitchGraph';

const Play = () => {
  const { id } = useParams();
  const [dimensions, setDimensions] = useState({ width: 0, height: 600 });
  const containerRef = useRef(null);

  const { pitch, clarity, decibel, graphData } = usePitchDetection();

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
              <PitchGraph dimensions={dimensions} graphData={graphData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Play;