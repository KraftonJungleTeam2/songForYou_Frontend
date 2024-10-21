import React, { useState, useEffect, useRef } from 'react';
import { usePitchDetection } from '../components/usePitchDetection';
import { getNote } from '../utils/NoteUtils';
import PitchGraph from '../components/PitchGraph';
import AudioPlayer from '../components/AudioPlayer';
import '../css/slider.css';


// function generateEntirePitchData(
//   totalDuration,
//   interval = 25,
//   delayDuration = 4,
//   dataDuration = 10
// ) {
//   const totalSamples = Math.ceil((totalDuration * 1000) / interval);
//   const pitchDataArray = [];

//   const frequencies = [
//     32.7, 65.41, 130.81, 261.63, 523.25, 1046.5, 2093.0, 4186.01,
//   ];

//   for (let i = 0; i < totalSamples; i++) {
//     const currentTime = i * interval; // 밀리초 단위

//     let pitchData;
//     if (currentTime < delayDuration * 1000) {
//       pitchData = { time: currentTime, pitch: null };
//     } else {
//       const t = (currentTime - delayDuration * 1000) / (dataDuration * 1000);

//       const octaveIndex = Math.floor(t * 7);
//       const octaveFraction = (t * 7) % 1;

//       const lowerFreq = frequencies[octaveIndex];
//       const upperFreq = frequencies[Math.min(octaveIndex + 1, 7)];
//       const interpolatedFreq = linearInterpolation(
//         lowerFreq,
//         upperFreq,
//         octaveFraction
//       );

//       const smoothness = Math.sin(t * Math.PI * 2) * 0.1;
//       const pitch = interpolatedFreq * (1 + smoothness);

//       pitchData = { time: currentTime, pitch };
//     }

//     pitchDataArray.push(pitchData);
//   }

//   return pitchDataArray;
// }

function doubleDataFrequency(dataArray) {
  const doubledData = [];
  for (let i = 0; i < dataArray.length; i++) {
    doubledData.push(dataArray[i]);  // 첫 번째 복사
    doubledData.push(dataArray[i]);  // 두 번째 복사
  }
  return doubledData;
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

      const frequencyData = [null, null, null, null, null, null, null, null, null, null, 328.59188250253555, 330.04841133326664, 328.1149749901265, 329.5397204803954, 330.61012458454564, 329.0189093261768, 331.4406468963103, 336.03218296008174, 346.5547046611308, 364.32617863912213, 378.26374309399506, 390.44788621574554, 393.444792481578, 334.64870906731437, null, null, null, null, 346.0456786055733, null, 352.3499108507624, 368.6445834964109, 330.2167613132463, 330.98170582873627, 329.1585989213272, 329.46896283473797, 329.274571249324, 330.1088031903421, 330.1159129853262, 330.0679570548294, 331.87057712483227, 342.4602141268365, 364.73216485960495, 386.89597448536733, 392.2913893345311, 390.84451623762817, null, 339.90875193586237, null, 274.10981234022444, 261.5686585321488, 261.4763156038319, 261.4513498318364, 260.33579114337135, 262.2325452455168, 264.94445761077736, null, 442.6931130277186, 410.14625269859886, 401.5475137264218, 399.2715574418659, 396.3933490858801, null, 437.2145003354132, 441.61010673752656, 440.11951021545065, 441.5240923733918, 439.6457133204786, 440.018040592209, 440.77496628578876, 442.70407211229207, 434.2532391119324, 418.08640055402634, 403.5016738822478, 393.1363124969738, 392.22361871891843, 383.4392576826699, 338.4678634606292, 328.62285117369987, 330.0754946652236, null, 334.99786670347254, 329.43783488930353, 328.1977965422979, 330.0535805363296, 329.749906413312, 328.59396734575233, 328.82344924611255, 327.91201371239225, 328.93558634082353, 331.4364725026322, 330.8216542938628, null, null, 332.35609443271727, 335.14221417660747, null, null, null, 333.0251169820806, 331.13426547212754, 328.4739692989569, 329.6491940969396, 328.8015685539651, 329.6776374669656, 330.1041645451253, 329.9241639519879, 329.0177721258809, 329.3737558680951, 329.6702270081163, 328.9838239223849, 329.4753130688335, 329.96734988278325, 328.95825734778305, 329.4229760046181, 329.00998951766996, 332.1086658357129, 330.41596276540236, 329.2078875702797, 331.13430537677397, 337.1142981335107, 330.9817184810058, null, null, 331.03033776384194, null, null, null, null, 523.1918242392398, 520.6274622352237, 524.6740961514038, 522.7894440180712, 497.9194989107816, 495.4680482470061, 494.8900865628667, 493.1280853151912, 497.1609121489385, 489.7906072883294, null, 495.6509232466079, 496.3247922256469, 493.8840753303547, 494.0294094356799, 494.4113059060157, 495.65923485483916, 494.08114955356217, null, 441.26184080197845, 436.33995614520904, 414.13926082476814, 380.42928346394154, 334.95270857012423, 328.380939038944, 328.0646354593899, 329.57503354229016, 328.07796824541026, 329.22735590606834, 329.0342022840335, 334.0035310163319, 341.4870701189608, 353.3954737460725, 366.3976574809435, 382.70432052961917, 392.91907292135534, 393.25083829361154, 392.17932430209726, 391.57762952077235, 392.84518151658114, 392.28552554196943, 393.16651956286313, 390.6986560781888, 383.26216894403035, 390.96006411111273, 395.6478067226235, 385.993661689027, 378.9517250620396, 401.8762863026922, 388.5640223892591, null, null, 383.6974615215155, 385.6270258815125, 388.35631242984385, null, 351.4201030064627, null, null, null, null];

      const doubledFrequencyData = doubleDataFrequency(frequencyData);

      const precomputedReferData = doubledFrequencyData.map((pitch, index) => ({
        time: index * 25, // 25ms 단위로 시간 계산
        pitch,
      }));

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
          <div className="p-4 border border-gray-300 rounded-lg overflow-hidden" style={{ width: '1000px' }}>
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
