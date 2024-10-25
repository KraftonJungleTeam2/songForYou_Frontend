// PitchGraph.js
import React, { useEffect, useRef } from 'react';
import { getCFrequencies, logScale } from '../utils/GraphUtils';

// ArrayBuffer를 Base64로 변환하는 유틸리티 함수
const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const PitchGraph = ({
  dimensions,
  realtimeData,
  referenceData,
  dataPointCount = 200,
  currentTimeIndex, // 변경된 prop
  songState
}) => {
  const backgroundCanvasRef = useRef(null);
  const dataCanvasRef = useRef(null);
  const cFrequencies = getCFrequencies();
  const graphWidth = dimensions.width;

  // 배경 그리기
useEffect(() => {
  const canvas = backgroundCanvasRef.current;
  const ctx = canvas.getContext('2d');

  // 캔버스 초기화
  ctx.clearRect(0, 0, dimensions.width, dimensions.height);

  const image = new Image();

  // songState에 이미지가 있으면 Base64로 설정
  if (songState && songState.image && songState.image.data) {
    image.src = `data:image/jpeg;base64,${arrayBufferToBase64(songState.image.data)}`;
  }

  // 이미지 로드 후 그리기
  image.onload = () => {
    // 블러 필터 설정
    ctx.filter = 'blur(15px)';
    const imgHeight = image.height;
    const imgWidth = image.width;

    // 이미지 그리기
    ctx.drawImage(
      image,
      0,
      -(imgHeight + dimensions.height) / 2,
      graphWidth,
      (imgHeight / imgWidth) * dimensions.width
    );

    // 블러 필터 초기화 (이미지만 블러 처리)
    ctx.filter = 'none';

      // 이미지 위에 어둡게 덮는 반투명한 사각형
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // 어둡게 할 색상 설정
    ctx.fillRect(0, 0, dimensions.width, dimensions.height); // 이미지 전체에 덮기
    

    // 기준 선 그리기
    ctx.beginPath();
    ctx.strokeStyle = '#EEEEEE';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(255, 170, 150, 0.8)';
    // ctx.shadowBlur = 10;
    ctx.moveTo(graphWidth / 3, 0);
    ctx.lineTo(graphWidth / 3, dimensions.height);
    ctx.stroke();

    // 그림자 설정 초기화
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // 수평선과 레이블 그리기
    cFrequencies.forEach((freq, index) => {
      const y = logScale(freq, dimensions, cFrequencies);

      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.moveTo(0, y);
      ctx.lineTo(dimensions.width, y);
      ctx.stroke();

       // 레이블 글자 설정
      ctx.fillStyle = 'white';  // 글자 색깔 하얀색으로 설정
      ctx.font = '10px Arial';
      ctx.textBaseline = 'middle';
      ctx.fillText(`C${index + 2}`, 15, y);
    });
  };
}, [dimensions, songState, graphWidth]);

  // 실시간 및 참조 데이터 그리기
  useEffect(() => {
    const canvas = dataCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // 캔버스 초기화
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Pitch 데이터를 그리는 함수 수정
    const drawPitchData = (data, color, glow = false, currentTimeIndex = 0, isRealtime = false) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      if (glow) {
        ctx.shadowColor = 'rgba(255, 170, 150, 0.8)';
        ctx.shadowBlur = 5;
      }

      let start = 0;
      let end = 0;
      let visibleData = [];

      if(!isRealtime){
      // 슬라이스 인덱스 계산 (end는 data.length를 초과하지 않도록 제한)
      start = Math.max(0, Math.floor(currentTimeIndex) - dataPointCount);
      end = Math.min(data.length, Math.floor(currentTimeIndex) + (dataPointCount * 2));
      visibleData = data.slice(start, end);
      }
      else{
      start = Math.max(0, Math.floor(currentTimeIndex) - dataPointCount);
      visibleData = data.slice(start, currentTimeIndex+1);
      }
      
      const windowSize = dataPointCount * 3; // 데이터 포인트 수
      const pixelsPerIndex = graphWidth / windowSize;
      const x0 = graphWidth / 3; // 기준 x 위치

      visibleData.forEach((point, index) => {
        const dataIndex = start + index; // 전체 데이터에서의 실제 인덱스

        // point가 undefined인지, 또는 pitch가 null인지 확인
        if (!point || point.pitch === null) return;
        const prevPoint = data[dataIndex - 1];
        if (!prevPoint || prevPoint.pitch === null) {
          return;
        }

        // 인덱스를 기반으로 시간 차이 계산
        let indexDifference1 = 0;
        let indexDifference2 = 0;
        
        if(isRealtime){
        indexDifference1 = dataIndex -1 - currentTimeIndex;
        indexDifference2 = dataIndex  - currentTimeIndex;
        }
        else{
        indexDifference1 = (dataIndex - 1) - currentTimeIndex;
        indexDifference2 = dataIndex - currentTimeIndex;
        }
        // x 좌표 계산
        const x1 = x0 + indexDifference1 * pixelsPerIndex;
        const x2 = x0 + indexDifference2 * pixelsPerIndex;
      

        // y 좌표 계산
        const y1 = logScale(prevPoint.pitch, dimensions, cFrequencies);
        const y2 = logScale(point.pitch, dimensions, cFrequencies);

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      });

      ctx.stroke();

      // 그림자 설정 초기화
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    };


    // 참조 피치 데이터 그리기
    drawPitchData(referenceData, '#FFFFFF', true, currentTimeIndex); // 흰색
    // 실시간 피치 데이터 그리기
    drawPitchData(realtimeData, '#FFA500', true, currentTimeIndex, true); // 주황색

    

  }, [dimensions, referenceData, realtimeData, cFrequencies, dataPointCount, currentTimeIndex, graphWidth]);

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
