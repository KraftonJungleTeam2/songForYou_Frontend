import React, { useState, useEffect, useRef} from 'react';
import { usePitchDetection } from '../components/usePitchDetection';
import { getNote } from '../utils/NoteUtils';
import PitchGraph from '../components/PitchGraph';
import AudioPlayer from '../components/AudioPlayer';
import '../css/slider.css';
import '../css/karaoke-lyrics.css';
import { useLocation, useParams } from 'react-router-dom'; // URL에서 곡 ID 가져오기
import TopBar from '../components/TopBar';
import Sidebar from '../components/SideBar';


// 50ms 단위인 음정 데이터를 맞춰주는 함수 + 음정 타이밍 0.175s 미룸.
function doubleDataFrequency(dataArray) {
  const doubledData = [];
  const referdelay = 175;
  const appendnullnum = referdelay / 25;

  for (let j = 0; j < appendnullnum; j++) {
    doubledData.push(null);
  }

  for (let i = 0; i < dataArray.length; i++) {
    doubledData.push(dataArray[i]); // 첫 번째 복사
    doubledData.push(dataArray[i]); // 두 번째 복사
  }

  return doubledData;
}

const Play = () => {
  // song State 받아옴
  const location = useLocation();
  const { song } = location.state || {};
  // console.log(song);

  const { id: songId } = useParams(); // URL에서 songId 추출
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
  
  const getPitch = usePitchDetection(isPlaying);
  const [currentPitch, setCurrentPitch] = useState(0);


  const [entireGraphData, setEntireGraphData] = useState([]);
  const [entireReferData, setEntireReferData] = useState([]);
  
  // 재생 위치 및 길이
  const [playbackPosition, setPlaybackPosition] = useState(0); // 시크 바에 표시될 재생 위치 (25ms 단위 모든 데이터가 이를 기준으로 update)
  const playbackPositionRef = useRef(playbackPosition); // 최신 재생 위치 참조 유지
  playbackPositionRef.current = playbackPosition; // `useRef`를 통해 최신 재생 위치를 참조로 유지

  const [userSeekPosition, setUserSeekPosition] = useState(0); // 사용자가 시크 바를 조작하여 변경한 위치
  const [duration, setDuration] = useState(0); // 오디오 전체 길이 (초 단위)
  const [currentLyric, setCurrentLyric] = useState(''); // 현재 재생 중인 가사 상태

  const handlePlaybackPositionChange = (e) => {
    const newPosition = parseFloat(e.target.value);
    setUserSeekPosition(newPosition);
    setPlaybackPosition(newPosition); // 시크 바 업데이트
  };

  const handleSpeedChange = (e) => {
    const newSpeed = parseInt(e.target.value, 10);
    setDataPointCount(newSpeed);
  };

  const [audioLoaded, setAudioLoaded] = useState(false);
  const [pitchLoaded, setPitchLoaded] = useState(false);
  const [lyricsLoaded, setLyricsLoaded] = useState(false);

  const [mrDataBlob, setMrDataBlob] = useState(null);
  const [lyricsData, setLyricsData] = useState(null);

  // 화면 조정 시 감지
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
    // getPitch로부터 피치를 가져와 currentPitch 업데이트
    const interval = setInterval(() => {
      setCurrentPitch(getPitch());
    }, 25); // 25ms마다 피치 업데이트
  
    return () => clearInterval(interval); // 컴포넌트 언마운트 시 interval 해제
  }, []); // 초기 마운트 시 한 번만 실행

  // 모든 데이터가 로드되었는지 확인
  const dataLoaded = audioLoaded && pitchLoaded && lyricsLoaded;

  // 서버에서 데이터 로딩 후 배열 생성
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/songs/play/${songId}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const formData = await response.formData();
        const result = Object.fromEntries(formData.entries());

        // 파일 데이터 처리 ('file' 필드명 확인)
        const fileBlob = result.file; // 서버 응답 필드명: 'file'
        if (fileBlob instanceof Blob) {
          setMrDataBlob(fileBlob);
        } else {
          console.error('Error: file not found or invalid in the response');
        }

        // pitch 데이터 처리 ('pitch' 필드명 확인)
        const pitchString = result.pitch;
        if (typeof pitchString === 'string') {
          try {
            const pitchArray = JSON.parse(pitchString);
            if (Array.isArray(pitchArray)) {
              const processedPitchArray = doubleDataFrequency(pitchArray);
              setEntireReferData(
                processedPitchArray.map((pitch, index) => ({
                  time: index * 25, // 25ms 단위로 시간 계산
                  pitch,
                }))
              );
              
              setEntireGraphData(
                processedPitchArray.map((_, index) => ({
                time: index * 25, // 25ms 단위로 시간 계산
                pitch: null,
              }))
            );
          
              setPitchLoaded(true);
            } else {
              console.warn('Warning: pitch data is not an array');
              setPitchLoaded(true); // pitch 데이터가 없어도 로드 완료로 표시
            }
          } catch (parseError) {
            console.error('Error parsing pitch data:', parseError);
            setPitchLoaded(true); // 파싱 실패 시에도 로드 완료로 표시
          }
        } else {
          console.warn('Warning: pitch data not found or invalid in the response');
          setPitchLoaded(true); // pitch 데이터가 없어도 로드 완료로 표시
        }

        // lyrics 데이터 처리 ('lyrics' 필드명 확인)
        const lyricsString = result.lyrics;
        if (typeof lyricsString === 'string') {
          try {
            const lyrics = JSON.parse(lyricsString);
            if (lyrics && typeof lyrics === 'object') {
              setLyricsData(lyrics);
              setLyricsLoaded(true);
            } else {
              console.warn('Warning: lyrics data is not an object');
              setLyricsLoaded(true); // lyrics 데이터가 없어도 로드 완료로 표시
            }
          } catch (parseError) {
            console.error('Error parsing lyrics data:', parseError);
            setLyricsLoaded(true); // 파싱 실패 시에도 로드 완료로 표시
          }
        } else {
          console.warn('Warning: lyrics data not found or invalid in the response');
          setLyricsLoaded(true); // lyrics 데이터가 없어도 로드 완료로 표시
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (songId) {
      fetchData();
    }
  }, [songId]);

  // 재생 위치에 따라 가사 업데이트
  useEffect(() => {
    if (lyricsData && Array.isArray(lyricsData.start) && Array.isArray(lyricsData.end) && Array.isArray(lyricsData.text)) {
      for (let i = 0; i < lyricsData.start.length; i++) {
        if (playbackPosition >= lyricsData.start[i] && playbackPosition <= lyricsData.end[i]) {
          setCurrentLyric(lyricsData.text[i]);
          return; // 가사를 찾으면 루프 종료
        }
      }
      setCurrentLyric(''); // 현재 재생 위치에 해당하는 가사가 없을 경우 빈 문자열
    }

  }, [playbackPosition, lyricsData]);

  useEffect(() => {
    const index = Math.floor(playbackPositionRef.current * 40); // `playbackPosition` 기준 인덱스 계산
  
    setEntireGraphData((prevData) => {
      const newData = [...prevData];
      
      if (index >= 0 && index < newData.length) {
        // currentPitch가 0이거나 null일 경우 바로 전 인덱스의 pitch 값 가져오기
        const pitchValue = currentPitch !== 0 ? currentPitch : (index > 0 ? newData[index - 1].pitch : 0);
        
        newData[index] = {
          time: Math.floor(playbackPositionRef.current),
          pitch: pitchValue,
        };
  
        // 디버깅 로그
        // console.log(index);
        // console.log(newData[index]);
      }
      return newData;
    });
  }, [playbackPositionRef, currentPitch, setEntireGraphData]);
  
  return (
    <div className='single-page'>
      <Sidebar />
      <div className='main-content'>
        <TopBar />
        <div className='flex flex-col' ref={containerRef} style={{display: 'flex',flexDirection: 'column', marginLeft: '10px', marginRight: '10px' }}>
          {/* <h1 className='text-2xl font-bold mb-4 text-center p-4'>Pitch Detector</h1>
          <div className='flex flex-col'>
            <div className='p-4 bg-gray-50 flex justify-around items-center'>
              <p className='text-lg'>
                <span className='font-semibold'>Pitch:</span> {pitch ? `${pitch.toFixed(2)} Hz (${getNote(pitch)})` : 'N/A'}
              </p>
              <p className='text-lg'>
                <span className='font-semibold'>Clarity:</span> {clarity ? `${(clarity * 100).toFixed(2)}%` : 'N/A'}
              </p>
              <p className='text-lg'>
                <span className='font-semibold'>Decibel:</span> {decibel ? `${decibel.toFixed(2)} dB` : 'N/A'}
              </p>
            </div>
          </div> */}

          {/* Pitch Graph */}
          <div style={{ width: '100%', height: '470px' }}>
            <PitchGraph dimensions={dimensions} realtimeData = {entireGraphData} referenceData={entireReferData}  dataPointCount={dataPointCount} currentTimeIndex={playbackPosition * 40} songState={song} />
          </div>

          {/* 현재 재생 중인 가사 출력 */}
          <p className='karaoke-lyrics' style={{ height: '150px' , textAlign: 'center' }}>
            {currentLyric}
          </p>

          {/* 오디오 플레이어 컨트롤 */}
          <div style={{ width: '1000px' }}>
            <button onClick={onClickPlayPauseButton} disabled={!dataLoaded}>
              {isPlaying ? '일시정지' : '재생'}
            </button>
            <input type='range' min='0' max={duration} step='0.025' value={playbackPosition} onChange={handlePlaybackPositionChange} className='w-full range-slider' disabled={!dataLoaded} />
            <div>
              {playbackPosition.toFixed(3)} / {Math.floor(duration)} 초
            </div>

            <div>
              <label>속도 조절:</label>
              <input type='range' min='25' max='300' step='1' value={dataPointCount} onChange={handleSpeedChange} className='w-full range-slider' />
              <div>렌더링 사이즈: {dataPointCount}</div>
            </div>
            {!dataLoaded && <p>데이터 로딩 중...</p>}
          </div>

          {/* 오디오 플레이어 컴포넌트 */}
          <AudioPlayer isPlaying={isPlaying} setIsPlaying={setIsPlaying} userSeekPosition={userSeekPosition} setDuration={setDuration} audioBlob={mrDataBlob} setAudioLoaded={setAudioLoaded} onPlaybackPositionChange={setPlaybackPosition} />
        </div>
      </div>
    </div>
  );
};

export default Play;
