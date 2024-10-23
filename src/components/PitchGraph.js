// PitchGraph.js
import React, { useEffect, useRef } from 'react';
import { getCFrequencies, logScale } from '../utils/GraphUtils';

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};
const PitchGraph = ({ dimensions, referenceData, realtimeData, dataPointCount = 200, currentTimeMs, songState}) => {
  const backgroundCanvasRef = useRef(null);
  const dataCanvasRef = useRef(null);
  const cFrequencies = getCFrequencies();
  const graphWidth = dimensions.width;

  // 배경 그리기
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // 데이터 캔버스 초기화
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);


    const image = new Image();
    
    // songState 이미지가 있으면 그 이미지를 base64로 설정
    if (songState && songState.image && songState.image.data) {
      image.src = `data:image/jpeg;base64,${arrayBufferToBase64(songState.image.data)}`;
    } 
    
    // 블러 필터 설정
    ctx.filter = 'blur(15px)'; // 10px 정도의 블러 효과
    const imgHeight = image.height;
    const imgWidth = image.width;
      console.log(imgHeight, imgWidth);
      console.log(graphWidth, dimensions.height);
    // 이미지 그리기 (이미지를 흐리게 적용)
    ctx.drawImage(image, 0, -(imgHeight+dimensions.height)/2, graphWidth, imgHeight / imgWidth * dimensions.width);

            
    // 블러 필터를 제거하여 이후 요소에 영향을 주지 않도록 함
    ctx.filter = 'none';
    
  }, [dimensions]);

  // 실시간 및 참조 데이터 그리기
  useEffect(() => {
    const canvas = dataCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // 데이터 캔버스 초기화
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

          
    // 추가적인 그리기 작업을 수행할 수 있습니다
    // 예: 다른 요소나 텍스트를 그릴 때 블러가 적용되지 않도록
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(dimensions.width/3, 0, dimensions.width, dimensions.height); // 흐리지 않은 사각형 그리기
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height); // 흐리지 않은 사각형 그리기
    
    // Pitch 데이터 그리는 함수
    const drawPitchData = (data, color, startpoint, glow=false, useTime = false, currentTimeMs = 0) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      if (glow) {
        ctx.shadowColor = 'rgba(255, 170, 150, 0.8)'; // 글로우 색상
        ctx.shadowBlur = 5;                // 글로우 강도 (블러 크기)
      }

      if (useTime) {
        const interval = 25; // 밀리초 단위
        const windowSize = dataPointCount * 3; // 데이터 포인트 수
        const totalTimeWindowMs = windowSize * interval;
        const pixelsPerMillisecond = graphWidth / totalTimeWindowMs;
        const x0 = graphWidth / 3; // 시간 차이가 0인 x 위치

        data.forEach((point, index) => {
          if (index === 0 || point.pitch === null) return;
          const prevPoint = data[index - 1];
          if (prevPoint.pitch === null) return;

          const timeDifference1 = prevPoint.time - currentTimeMs;
          const timeDifference2 = point.time - currentTimeMs;

          const x1 = x0 + timeDifference1 * pixelsPerMillisecond;
          const x2 = x0 + timeDifference2 * pixelsPerMillisecond;

          // x 좌표가 캔버스 내에 있는 경우에만 그리기
          if ((x1 < 0 && x2 < 0) || (x1 > graphWidth && x2 > graphWidth)) {
            return;
          }

          const y1 = logScale(prevPoint.pitch, dimensions, cFrequencies);
          const y2 = logScale(point.pitch, dimensions, cFrequencies);

          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        });
      } else {
        // 실시간 데이터에 대한 기존 인덱스 기반 x-좌표 계산
        data.forEach((point, index) => {
          if (index === 0 || point.pitch === null) return;
          const prevPoint = data[index - 1];
          if (prevPoint.pitch === null) return;

          // 실시간 스케일
          const x1 = startpoint - (data.length - index + 1) * (graphWidth /3 / dataPointCount);
          const x2 = startpoint - (data.length - index) * (graphWidth/ 3 / dataPointCount);
          const y1 = logScale(prevPoint.pitch, dimensions, cFrequencies);
          const y2 = logScale(point.pitch, dimensions, cFrequencies);

          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        });
      }
      ctx.stroke();

      // shadow 설정 초기화
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    };

    // 1/3 지점에 파란색 수직선 그리기
    const drawBlueLine = () => {
      ctx.beginPath();
      ctx.strokeStyle = '#EEEEEE';
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(255, 170, 150, 0.8)'; // 글로우 색상
      ctx.shadowBlur = 10;                // 글로우 강도 (블러 크기)
      ctx.moveTo(graphWidth / 3, 0);
      ctx.lineTo(graphWidth / 3, dimensions.height - 0);
      ctx.stroke();

      // shadow 설정 초기화
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    };

    // 참조 피치 그래프 그리기
    drawPitchData(referenceData, '#FFFFFF', graphWidth, false, true, currentTimeMs);  // 녹색
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, dimensions.width/3, dimensions.height); // 흐리지 않은 사각형 그리기
    // 실시간 피치 그래프 그리기
    drawPitchData(realtimeData, '#FFA500', graphWidth/3, true);  // 주황색
    
    // 파란선 그리기
    drawBlueLine();

        // 수평선과 레이블 그리기
        cFrequencies.forEach((freq, index) => {
          const y = logScale(freq, dimensions, cFrequencies);
    
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.moveTo(0, y);
          ctx.lineTo(dimensions.width, y);
          ctx.stroke();
    
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.textBaseline = 'middle';
          ctx.fillText(`C${index + 2}`, 15, y);
        });
    
        
  }, [dimensions, referenceData, realtimeData, cFrequencies, dataPointCount, currentTimeMs, cFrequencies]);

  return (
    <>
      <canvas
        ref={dataCanvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ position: 'absolute', zIndex: 2 }}
      />
      <canvas
        ref={backgroundCanvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ position: 'absolute', zIndex: 1 }}
      />
    </>
  );
};

export default PitchGraph;
