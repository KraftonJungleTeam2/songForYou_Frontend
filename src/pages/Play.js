import React, { useState, useEffect, useRef } from 'react';
import { usePitchDetection } from '../components/usePitchDetection';
import { getNote } from '../utils/NoteUtils';
import PitchGraph from '../components/PitchGraph';
import AudioPlayer from '../components/AudioPlayer';
import '../css/slider.css';

function linearInterpolation(a, b, t) {
  return a + (b - a) * t;
}

function generateEntirePitchData(
  totalDuration,
  interval = 25,
  delayDuration = 4,
  dataDuration = 10
) {
  const totalSamples = Math.ceil((totalDuration * 1000) / interval);
  const pitchDataArray = [];

  const frequencies = [
    32.7, 65.41, 130.81, 261.63, 523.25, 1046.5, 2093.0, 4186.01,
  ];

  for (let i = 0; i < totalSamples; i++) {
    const currentTime = i * interval; // 밀리초 단위

    let pitchData;
    if (currentTime < delayDuration * 1000) {
      pitchData = { time: currentTime, pitch: null };
    } else {
      const t = (currentTime - delayDuration * 1000) / (dataDuration * 1000);

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

      pitchData = { time: currentTime, pitch };
    }

    pitchDataArray.push(pitchData);
  }

  return pitchDataArray;
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

  const [dataPointCount, setDataPointCount] = useState(200); // 속도에 따른 dataPointCount
  const { pitch, clarity, decibel, graphData } = usePitchDetection(isPlaying, dataPointCount);

  const [entireReferData, setEntireReferData] = useState([]);
  const [refer, setRefer] = useState([]);

  // Playback position and duration
  const [playbackPosition, setPlaybackPosition] = useState(0); // 시크 바에 표시될 재생 위치 (초 단위)
  const [userSeekPosition, setUserSeekPosition] = useState(0); // 사용자가 시크 바를 조작하여 변경한 위치
  const [duration, setDuration] = useState(0); // 오디오 전체 길이 (초 단위)

  const handlePlaybackPositionChange = (e) => {
    const newPosition = parseFloat(e.target.value);
    setUserSeekPosition(newPosition);
    setPlaybackPosition(newPosition); // 시크 바 업데이트
  };

  const handleSpeedChange = (e) => {
    const newSpeed = parseInt(e.target.value);
    setDataPointCount(newSpeed);
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

  // 오디오가 로드되고 duration이 결정되면 전체 refer 데이터를 생성
  useEffect(() => {
    if (duration > 0) {
      const totalDuration = duration; // 초 단위
      const interval = 25; // 밀리초 단위

      const precomputedReferData = generateEntirePitchData(totalDuration, interval);
      setEntireReferData(precomputedReferData);
    }
  }, [duration]);

  // playbackPosition에 따라 refer 데이터 업데이트
  useEffect(() => {
    const interval = 25; // 밀리초 단위
    const windowSize = dataPointCount * 3; // 표시할 데이터 포인트 수 (dataPointCount의 3배)

    // playbackPosition을 밀리초로 변환
    const currentTimeMs = playbackPosition * 1000;

    // 시작 및 종료 시간 계산
    const windowEndTime = currentTimeMs;
    const windowStartTime = currentTimeMs - (windowSize - 1) * interval;

    // windowStartTime이 음수가 되지 않도록 처리
    const actualWindowStartTime = Math.max(0, windowStartTime);

    // 전체 refer 데이터에서 해당 구간 추출
    const startIndex = Math.floor(actualWindowStartTime / interval);
    const endIndex = Math.floor(windowEndTime / interval);

    // 구간 데이터 추출
    const windowData = entireReferData.slice(startIndex, endIndex + 1);

    // 데이터 길이가 windowSize보다 작으면 앞쪽에 null로 패딩
    const dataLength = windowData.length;
    if (dataLength < windowSize) {
      const padding = Array(windowSize - dataLength).fill({ pitch: null });
      setRefer([...padding, ...windowData]);
    } else {
      setRefer(windowData);
    }
  }, [playbackPosition, entireReferData, dataPointCount]);

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
            <div>
              <label>속도 조절:</label>
              <input
                type="range"
                min="25"
                max="300"
                step="1"
                value={dataPointCount}
                onChange={handleSpeedChange}
                className="w-full range-slider"
              />
              <div>렌더링 사이즈: {dataPointCount}</div>
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
                dataPointCount={dataPointCount}
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
