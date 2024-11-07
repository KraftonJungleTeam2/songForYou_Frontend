// src/pages/Play.js
import React, { useState, useEffect, useRef } from "react";
import { usePitchDetection } from "../components/usePitchDetection";
import { getNote } from "../utils/NoteUtils";
import PitchGraph from "../components/PitchGraph";
import AudioPlayer from "../components/AudioPlayer";
import "../css/slider.css";
import "../css/karaoke-lyrics.css";
import "../css/Play.css";
import { useLocation, useParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useNavigate } from "react-router-dom";
import NowPlayingLyrics from "../components/nowPlayingLyrics";
import { useScreen } from "../Context/ScreenContext";
import MobileNav from "../components/MobileNav";
import Sidebar from "../components/SideBar";
import PageTemplate from "../template/PageTemplate";

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
    if (dataArray[i] > 0 && dataArray[i + 1] > 0)
      doubledData.push((dataArray[i + 1] + dataArray[i]) / 2); // 두 번째 복사
    else doubledData.push(null);
  }

  return doubledData;
}

const Play = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isMobile } = useScreen();
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navigate = useNavigate();
  // song State 받아옴
  const location = useLocation();
  const { song } = location.state || {};
  const { id: songId } = useParams(); // URL에서 songId 추출

  const [dimensions, setDimensions] = useState({ width: 100, height: 600 });
  const containerRef = useRef(null);
  const localStreamRef = useRef(null);

  const [currSegment, setCurrSegment] = useState(" ");

  // 재생 제어
  const [isPlaying, setIsPlaying] = useState(false);
  const onClickPlayPauseButton = () => {
    if (dataLoaded) {
      setIsPlaying((prev) => !prev);
    } else {
      alert("데이터가 아직 로드되지 않았습니다.");
    }
  };

  // 재생 위치 및 길이
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const playbackPositionRef = useRef(playbackPosition);
  playbackPositionRef.current = playbackPosition;

  const [userSeekPosition, setUserSeekPosition] = useState(0);

  const [duration, setDuration] = useState(0);
  const [prevLyric, setPrevLyric] = useState(" ");
  const [currentLyric, setCurrentLyric] = useState(" ");
  const [nextLyric, setNextLyric] = useState(" ");

  // 데이터 로드 상태
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [pitchLoaded, setPitchLoaded] = useState(false);
  const [lyricsLoaded, setLyricsLoaded] = useState(false);

  const [mrDataBlob, setMrDataBlob] = useState(null);
  const [lyricsData, setLyricsData] = useState(null);

  // 렌더링 크기 및 속도 상태
  const [dataPointCount, setDataPointCount] = useState(100);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 속도 제어 상태 추가

  // 점수 확인 용
  const [score, setScore] = useState(0);
  const [instantScore, setInstantScore] = useState(0);

  useEffect(() => {
    // 슬라이더 진행도 업데이트 함수
    function updateSliderProgress(slider) {
      const max = slider.max;
      const value = slider.value;
      const percentage = (value / max) * 100;
      slider.style.backgroundSize = `${percentage}% 100%`;
    }

    // 슬라이더 요소 선택
    const slider = document.querySelector(".range-slider-play");
    if (slider) {
      updateSliderProgress(slider); // 초기 진행 상태 업데이트
      slider.addEventListener("input", () => updateSliderProgress(slider)); // 슬라이더 변경 시 업데이트
    }

    // Cleanup
    return () => {
      if (slider) {
        slider.removeEventListener("input", () => updateSliderProgress(slider));
      }
    };
  }, [playbackPosition]); // playbackPosition 변경 시마다 실행

  const handlePlaybackPositionChange = (e) => {
    const newPosition = parseFloat(e.target.value);
    setUserSeekPosition(newPosition);
    setPlaybackPosition(newPosition);

    // 슬라이더 진행도 업데이트
    const slider = e.target;
    const percentage = (newPosition / slider.max) * 100;
    slider.style.backgroundSize = `${percentage}% 100%`;
  };

  const handleSpeedChange = (e) => {
    const newSpeed = parseInt(e.target.value, 10);
    setDataPointCount(newSpeed);
  };

  const handlePlaybackSpeedChange = (e) => {
    const newPlaybackSpeed = parseFloat(e.target.value);
    setPlaybackSpeed(newPlaybackSpeed);
  };

  // 화면 비율 조정 감지
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight * 0.7,
        });
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 모든 데이터가 로드되었는지 확인
  const dataLoaded = audioLoaded && pitchLoaded && lyricsLoaded;

  // 서버에서 데이터 로딩 후 배열 생성
  const [entireGraphData, setEntireGraphData] = useState([]);
  const [entireReferData, setEntireReferData] = useState([]);

  // 마이크 스트림 획득
  const getLocalStream = async () => {
    try {
      // 기존 스트림이 있다면 정리
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });

      localStreamRef.current = stream;
    } catch (error) {
      console.error("Error getting local stream:", error);
      // throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_ENDPOINT}/songs/play/${songId}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // http 통신에서 전달받은 reponse 패킷? 같은 것을 다 뜯어서 formData로 파싱하는 것임.
        const formData = await response.formData();
        const result = Object.fromEntries(formData.entries());

        const fileBlob = result.file;
        if (fileBlob instanceof Blob) {
          setMrDataBlob(fileBlob);
        } else {
          console.error("Error: file not found or invalid in the response");
        }

        const pitchString = result.pitch;
        if (typeof pitchString === "string") {
          try {
            const pitchArray = JSON.parse(pitchString);
            const processedPitchArray = doubleDataFrequency(pitchArray);
            setEntireReferData(processedPitchArray);

            setEntireGraphData(
              new Array(processedPitchArray.length).fill(null)
            );

            setPitchLoaded(true);
          } catch (parseError) {
            console.error("Error parsing pitch data:", parseError);
            setPitchLoaded(true);
          }
        } else {
          console.warn(
            "Warning: pitch data not found or invalid in the response"
          );
          setPitchLoaded(true);
        }

        const lyricsString = result.lyrics;
        if (typeof lyricsString === "string") {
          try {
            const lyrics = JSON.parse(lyricsString);
            setLyricsData(lyrics);
            console.log(lyrics);
            setLyricsLoaded(true);
          } catch (parseError) {
            console.error("Error parsing lyrics data:", parseError);
            setLyricsLoaded(true);
          }
        } else {
          console.warn(
            "Warning: lyrics data not found or invalid in the response"
          );
          setLyricsLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (songId) {
      fetchData();
    }
  }, [songId]);

  // 재생 위치에 따라 가사 업데이트
  useEffect(() => {
    let curr_idx = -1;
    let segments = [];
    if (lyricsData && lyricsData.segments) {
      segments = lyricsData.segments;
      for (let i = 0; i < segments.length; i++) {
        if (playbackPosition >= segments[i].start) {
          curr_idx = i;
        } else if (curr_idx >= 0) {
          break;
        }
      }
    }
    setPrevLyric(segments[curr_idx - 1]?.text || " ");
    setCurrSegment(segments[curr_idx] || " ");
    setNextLyric(segments[curr_idx + 1]?.text || " ");
  }, [playbackPosition, lyricsData]);

  useEffect(() => {
    getLocalStream();
  }, []);

  // Use the custom hook and pass necessary parameters
  usePitchDetection(
    localStreamRef.current,
    isPlaying,
    true,
    playbackPositionRef,
    setEntireGraphData,
    entireReferData,
    {},
    setScore,
    setInstantScore,
    null
  );

  return (
    <PageTemplate
      isMobile={isMobile}
      isSidebarOpen={isSidebarOpen}
      toggleSidebar={toggleSidebar}
      current={"single"}
    >
      <div
        className="play-content-container component-container-play"
        ref={containerRef}
      >
        {/* Pitch Graph */}
        <div
          className="pitch-graph-play"
          style={{
            width: `${dimensions.width}`,
            height: `${dimensions.height}`,
          }}
        >
          <PitchGraph
            dimensions={dimensions}
            realtimeData={entireGraphData}
            referenceData={entireReferData}
            dataPointCount={dataPointCount}
            currentTimeIndex={playbackPosition * 40}
            songimageProps={song}
            score={instantScore}
          />
        </div>

        {/* 오디오 플레이어 컨트롤 */}
        <input
          className="range-slider-play"
          type="range"
          min="0"
          max={duration}
          step="0.025"
          value={playbackPosition}
          onChange={handlePlaybackPositionChange}
          disabled={!dataLoaded}
        />

        {/* 현재 재생 중인 가사 출력 */}
        <div className="karaoke-lyrics">
          <p className="prev-lyrics">{prevLyric}</p>
          <NowPlayingLyrics
            segment={currSegment}
            playbackPosition={playbackPositionRef.current}
          />
          <p className="next-lyrics">{nextLyric}</p>
        </div>

        {/* 오디오 플레이어 컴포넌트 */}
        <AudioPlayer
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          userSeekPosition={userSeekPosition}
          setDuration={setDuration}
          audioBlob={mrDataBlob}
          setAudioLoaded={setAudioLoaded}
          onPlaybackPositionChange={setPlaybackPosition}
          playbackSpeed={playbackSpeed} // 재생 속도 prop 추가
        />
      </div>

      <div className="score-setting-container component-container-play">
        <div className="score-area">
          <p id="score-title">실시간 점수</p>
          <p id="score">{score}</p>
        </div>

        <div className="play-info-area">
          <div className="playback-info">
            {playbackPosition.toFixed(1)} / {Math.floor(duration)} 초
          </div>

          {!dataLoaded && <p className="loading-text">데이터 로딩 중...</p>}

          <button onClick={onClickPlayPauseButton} disabled={!dataLoaded}>
            {isPlaying ? (
              <i class="fa-solid fa-pause"></i>
            ) : (
              <i class="fa-solid fa-play"></i>
            )}
          </button>
        </div>

        <div className="setting-area">
          <div className="speed-control">
            <label>속도 조절:</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={playbackSpeed}
              onChange={handlePlaybackSpeedChange}
              className="range-slider"
            />
            <div className="speed-control-value">
              재생 속도: {playbackSpeed} 배
            </div>
          </div>

          <div className="speed-control">
            <label>렌더링 사이즈:</label>
            <input
              type="range"
              min="25"
              max="300"
              step="1"
              value={dataPointCount}
              onChange={handleSpeedChange}
              className="range-slider"
            />
            <div className="speed-control-value">
              렌더링 사이즈: {dataPointCount}
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
};

export default Play;
