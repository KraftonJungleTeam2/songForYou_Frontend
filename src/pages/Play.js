import React, { useState, useEffect, useRef } from 'react';
import { usePitchDetection } from '../components/usePitchDetection';
import { getNote } from '../utils/NoteUtils';
import PitchGraph from '../components/PitchGraph';
import AudioPlayer from '../components/AudioPlayer';
import '../css/slider.css';

function linearInterpolation(a, b, t) {
  return a + (b - a) * t;
}

function generatePitchData(
  currentTime,
  delayDuration = 4,
  dataDuration = 10,
  interval = 25
) {
  const delaySamples = Math.floor((delayDuration * 1000) / interval);

  const frequencies = [
    32.7, 65.41, 130.81, 261.63, 523.25, 1046.5, 2093.0, 4186.01,
  ];

  if (currentTime < delaySamples) {
    return { time: currentTime * interval, pitch: null };
  } else {
    const t = ((currentTime - delaySamples) * interval) / (dataDuration * 1000);

    const octaveIndex = Math.floor(t * 7);
    const octaveFraction = (t * 7) % 1;

    const lowerFreq = frequencies[octaveIndex];
    const upperFreq = frequencies[Math.min(octaveIndex + 1, 7)];
    const interpolatedFreq = linearInterpolation(
      lowerFreq,
      upperFreq,
      octaveFraction
    );

    const smoothness = Math.sin(t * Math.PI * 2) * 0.1;
    const pitch = interpolatedFreq * (1 + smoothness);

    return { time: currentTime * interval, pitch };
  }
}

function updateReferData(
  prevData,
  currentTime,
  delayDuration = 4,
  dataDuration = 10,
  interval = 25
) {
  if (!Array.isArray(prevData)) prevData = [];
  const newPitchData = generatePitchData(
    currentTime,
    delayDuration,
    dataDuration,
    interval
  );
  return [...prevData, newPitchData].slice(-300);
}

const Play = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 600 });
  const containerRef = useRef(null);

  // Rendering control
  const [isPlaying, setIsPlaying] = useState(false);
  const onClickPlayPauseButton = () => {
    if (audioLoaded) {
      setIsPlaying((prev) => !prev);
    } else {
      alert('오디오가 아직 로드되지 않았습니다.');
    }
  };

  const { pitch, clarity, decibel, graphData } = usePitchDetection(isPlaying);

  const [refer, setRefer] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);

  // Playback position and duration
  const [playbackPosition, setPlaybackPosition] = useState(0); // 시크 바에 표시될 재생 위치
  const [userSeekPosition, setUserSeekPosition] = useState(0); // 사용자가 시크 바를 조작하여 변경한 위치
  const [duration, setDuration] = useState(0); // in seconds

  const handlePlaybackPositionChange = (e) => {
    const newPosition = parseFloat(e.target.value);
    setUserSeekPosition(newPosition);
    setPlaybackPosition(newPosition); // 시크 바 업데이트
  };

  const [audioLoaded, setAudioLoaded] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 500,
        });
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let intervalId;

    if (isPlaying) {
      intervalId = setInterval(() => {
        setRefer((prev) => updateReferData(prev, currentTime));
        setCurrentTime((prev) => prev + 1);

        if (currentTime * 25 >= 30000) {
          // 30 seconds limit
          clearInterval(intervalId);
        }
      }, 25); // 간격을 50ms로 늘려 CPU 부하 감소
    }

    return () => clearInterval(intervalId);
  }, [isPlaying, currentTime]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div
        className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
        ref={containerRef}
      >
        <h1 className="text-2xl font-bold mb-4 text-center p-4">
          Pitch Detector
        </h1>
        <div className="flex flex-col">
          <div className="p-4 bg-gray-50 flex justify-around items-center">
            <p className="text-lg">
              <span className="font-semibold">Pitch:</span>{' '}
              {pitch ? `${pitch.toFixed(2)} Hz (${getNote(pitch)})` : 'N/A'}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Clarity:</span>{' '}
              {clarity ? `${(clarity * 100).toFixed(2)}%` : 'N/A'}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Decibel:</span>{' '}
              {decibel ? `${decibel.toFixed(2)} dB` : 'N/A'}
            </p>
          </div>
          {/* Audio player controls */}
          <div className="p-4 border border-gray-300 rounded-lg overflow-hidden">
            <button onClick={onClickPlayPauseButton} disabled={!audioLoaded}>
              {isPlaying ? '일시정지' : '재생'}
            </button>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.01"
              value={playbackPosition}
              onChange={handlePlaybackPositionChange}
              className="w-full range-slider"
              disabled={!audioLoaded}
            />
            <div>
              {Math.floor(playbackPosition)} / {Math.floor(duration)} 초
            </div>
            {!audioLoaded && <p>오디오 로딩 중...</p>}
          </div>
          {/* Pitch Graph */}
          <div className="p-4">
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <PitchGraph
                dimensions={dimensions}
                referenceData={refer}
                realtimeData={graphData}
              />
            </div>
          </div>
        </div>
        {/* Audio Player Component */}
        <AudioPlayer
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          userSeekPosition={userSeekPosition}
          setDuration={setDuration}
          audioUrl="http://localhost:5000/music"
          setAudioLoaded={setAudioLoaded}
          onPlaybackPositionChange={setPlaybackPosition}
        />
      </div>
    </div>
  );
};

export default Play;
