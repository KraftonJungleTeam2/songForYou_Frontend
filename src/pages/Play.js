import React, { useState, useEffect, useRef } from 'react';
import { usePitchDetection } from '../components/usePitchDetection';
import { getNote } from '../utils/NoteUtils';
import PitchGraph from '../components/PitchGraph';
import AudioPlayer from '../components/AudioPlayer';
import '../css/slider.css';
import '../css/karaoke-lyrics.css';
import { useParams } from 'react-router-dom'; // URL에서 곡 ID 가져오기


function doubleDataFrequency(dataArray) {
  const doubledData = [];
  let referdelay = 175;
  let appendnullnum = referdelay / 25;
  for (let j = 0; j < appendnullnum; j++){
    doubledData.push(null);
  }

  for (let i = 0; i < dataArray.length; i++) {
    doubledData.push(dataArray[i]);  // 첫 번째 복사
    doubledData.push(dataArray[i]);  // 두 번째 복사
  }
  return doubledData;
}


const Play = () => {
  const { id: songId } = useParams(); // URL에서 songId 추출
  console.log('songId:', songId);
  const [dimensions, setDimensions] = useState({ width: 0, height: 600 });
  const containerRef = useRef(null);

  // 재생 제어
  const [isPlaying, setIsPlaying] = useState(false);
  const onClickPlayPauseButton = () => {
    if (dataLoaded) {
      setIsPlaying((prev) => !prev);
    } else {
      alert('데이터가 아직 로드되지 않았습니다.');
    }
  };

  const [dataPointCount, setDataPointCount] = useState(200);
  const { pitch, clarity, decibel, graphData } = usePitchDetection(isPlaying, dataPointCount);

  const [entireReferData, setEntireReferData] = useState([]);
  const [refer, setRefer] = useState([]);

  // 재생 위치 및 길이
  const [playbackPosition, setPlaybackPosition] = useState(0); // 시크 바에 표시될 재생 위치 (초 단위)
  const [userSeekPosition, setUserSeekPosition] = useState(0); // 사용자가 시크 바를 조작하여 변경한 위치
  const [duration, setDuration] = useState(0); // 오디오 전체 길이 (초 단위)
  const [currentLyric, setCurrentLyric] = useState(''); // 현재 재생 중인 가사 상태

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
  const [pitchLoaded, setPitchLoaded] = useState(false);
  const [lyricsLoaded, setLyricsLoaded] = useState(false);
  const [mrDataBlob, setMrDataBlob] = useState(null);
  const [lyricsData, setLyricsData] = useState(null);

  // 모든 데이터가 로드되었는지 확인
  const dataLoaded = audioLoaded && pitchLoaded && lyricsLoaded;

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

  // 서버에서 데이터 로딩
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/songs/play/${songId}`);
        const result = await response.json();

        if (result.success) {
          const data = result.data;

          // mr_data (Blob 데이터)
          const mrBufferData = data.mr_data.data; // Buffer 데이터 배열
          const mrBlob = new Blob([new Uint8Array(mrBufferData)], { type: 'audio/mp3' });
          setMrDataBlob(mrBlob);
          setAudioLoaded(true);

          // pitch 데이터가 포함되어 있는지 확인
          if (data.pitch) {
            const pitchArray = doubleDataFrequency(data.pitch);
            setEntireReferData(
              pitchArray.map((pitch, index) => ({
                time: index * 25, // 25ms 단위로 시간 계산
                pitch,
              }))
            );
            setPitchLoaded(true);
          } else {
            // pitch 데이터가 없는 경우에도 로드 완료로 표시
            setPitchLoaded(true);
          }

          // lyrics (가사 데이터)
          const lyricsData = data.lyrics;
          setLyricsData(lyricsData);
          setLyricsLoaded(true);
        } else {
          console.error('Error: Server responded with success: false');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (songId) {
      fetchData();
    }
  }, [songId]);

  // playbackPosition에 따라 refer 데이터 업데이트
  useEffect(() => {
    if (dimensions.width > 0 && pitchLoaded && entireReferData.length > 0) {
      const graphWidth = dimensions.width; // width에 기반해 graphWidth를 계산
      const interval = 25; // 밀리초 단위
      const windowSize = dataPointCount * 3; // 데이터 포인트 수
      const totalTimeWindowMs = windowSize * interval;
      const pixelsPerMillisecond = graphWidth / totalTimeWindowMs;
      const currentTimeMs = playbackPosition * 1000;

      const windowStartTime = currentTimeMs - (graphWidth / 3) / pixelsPerMillisecond;
      const windowEndTime = currentTimeMs + (2 * graphWidth / 3) / pixelsPerMillisecond;

      const actualWindowStartTime = Math.max(0, windowStartTime);
      const actualWindowEndTime = Math.min(duration * 1000, windowEndTime);

      const windowData = entireReferData.filter(
        (point) => point.time >= actualWindowStartTime && point.time <= actualWindowEndTime
      );

      setRefer(windowData);
    }
  }, [playbackPosition, entireReferData, dataPointCount, dimensions.width, pitchLoaded]);

  // 재생 위치에 따라 가사 업데이트
  useEffect(() => {
    if (lyricsData) {
      const { start, end, text } = lyricsData;

      for (let i = 0; i < start.length; i++) {
        if (playbackPosition >= start[i] && playbackPosition <= end[i]) {
          setCurrentLyric(text[i]);
          break;
        }
      }
    }
  }, [playbackPosition, lyricsData]);

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
          {/* 오디오 플레이어 컨트롤 */}
          <div className="p-4 border border-gray-300 rounded-lg overflow-hidden" style={{ width: '1000px' }}>
            <button onClick={onClickPlayPauseButton} disabled={!dataLoaded}>
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
              disabled={!dataLoaded}
            />
            <div>
              {playbackPosition.toFixed(2)} / {Math.floor(duration)} 초
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
            {!dataLoaded && <p>데이터 로딩 중...</p>}
          </div>
          {/* Pitch Graph */}
          <div className="p-4">
            <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ width: '100%', height: '500px' }}>
              <PitchGraph
                dimensions={dimensions}
                referenceData={refer}
                realtimeData={graphData}
                dataPointCount={dataPointCount}
                currentTimeMs={playbackPosition * 1000}
              />
            </div>
          </div>
          {/* 현재 재생 중인 가사 출력 */}
          <div className="karaoke-lyrics-container">
            <p className="karaoke-lyrics">{currentLyric}</p>
          </div>
        </div>
        {/* 오디오 플레이어 컴포넌트 */}
        <AudioPlayer
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          userSeekPosition={userSeekPosition}
          setDuration={setDuration}
          audioBlob={mrDataBlob} // 수정된 부분: audioUrl 대신 audioBlob 전달
          setAudioLoaded={setAudioLoaded}
          onPlaybackPositionChange={setPlaybackPosition}
        />
      </div>
    </div>
  );
};

export default Play;
