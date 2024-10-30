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
  dataPointCount = 100,
  currentTimeIndex,
  songState,
}) => {
  const backgroundCanvasRef = useRef(null);
  const dataCanvasRef = useRef(null);
  const cFrequencies = getCFrequencies();
  const graphWidth = dimensions.width;

  // 가이드 그리는 함수
  const drawGuidelinesAndLabels = (ctx) => {
    ctx.beginPath();
    ctx.strokeStyle = '#EEEEEE';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(255, 170, 150, 0.8)';
    ctx.shadowBlur = 10;
    ctx.moveTo(graphWidth / 3, 0);
    ctx.lineTo(graphWidth / 3, dimensions.height);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

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
  };

  // 배경 그리기
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    const ctx = canvas.getContext('2d');
    // 캔버스 초기화
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    const image = new Image();
    const hasImage = songState?.image?.data; // songState와 이미지가 있을 때만 처리
    // songState에 이미지가 있으면 Base64로 설정
    if (hasImage) {
      image.src = `data:image/jpeg;base64,${arrayBufferToBase64(songState.image.data)}`;
    }
    // 이미지가 있는 경우와 없는 경우를 분기
    if (hasImage) {
      image.src = `data:image/jpeg;base64,${arrayBufferToBase64(songState.image.data)}`;
      image.src = `data:image/jpeg;base64,${arrayBufferToBase64(songState.image.data)}`;
      image.onload = () => {
        ctx.filter = 'blur(10px)';
        const imgHeight = image.height;
        const imgWidth = image.width;

        ctx.drawImage(
          image,
          0,
          -(imgHeight + dimensions.height) / 2,
          graphWidth,
          (imgHeight / imgWidth) * dimensions.width
        );
        ctx.drawImage(image, 0, -(imgHeight + dimensions.height) / 2, graphWidth, (imgHeight / imgWidth) * dimensions.width);
        ctx.filter = 'none';

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);

        drawGuidelinesAndLabels(ctx);

      };
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      drawGuidelinesAndLabels(ctx);
    }
  }, [dimensions, songState, graphWidth]);
  // 실시간 및 참조 데이터 그리기
  useEffect(() => {
    const canvas = dataCanvasRef.current;
    const ctx = canvas.getContext('2d');
    // 캔버스 초기화
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    // Pitch 데이터를 그리는 함수 수정
    const drawPitchData = (data, color, glow = '', currentTimeIndex = 0, isRealtime = false) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      if (glow === 'coral') {
        ctx.shadowColor = 'rgba(255, 170, 150, 0.8)';
        ctx.shadowBlur = 5;
      } else if (glow === 'grey') {
        ctx.shadowColor = 'rgba(200, 200, 200, 0.8)';
        ctx.shadowBlur = 3;
      }
      let start = 0;
      let end = 0;
      let visibleData = [];
      if (!isRealtime) {
        // 슬라이스 인덱스 계산 (end는 data.length를 초과하지 않도록 제한)
        start = Math.max(0, Math.floor(currentTimeIndex) - dataPointCount);
        end = Math.min(data.length, Math.floor(currentTimeIndex) + dataPointCount * 2);
        visibleData = data.slice(start, end);
      } else {
        start = Math.max(0, Math.floor(currentTimeIndex) - dataPointCount);
        visibleData = data.slice(start, currentTimeIndex + 1);
      }
      const windowSize = dataPointCount * 3; // 데이터 포인트 수
      const pixelsPerIndex = graphWidth / windowSize;
      const x0 = graphWidth / 3;
      visibleData.forEach((point, index) => {
        const dataIndex = start + index;
        if (!point || point.pitch === null) return;
        const prevPoint = data[dataIndex - 1];
        if (!prevPoint || prevPoint.pitch === null) return;
        let indexDifference1 = isRealtime ? dataIndex - 1 - currentTimeIndex : dataIndex - 1 - currentTimeIndex;
        let indexDifference2 = isRealtime ? dataIndex - currentTimeIndex : dataIndex - currentTimeIndex;
        const x1 = x0 + indexDifference1 * pixelsPerIndex;
        const x2 = x0 + indexDifference2 * pixelsPerIndex;
        const y1 = logScale(prevPoint.pitch, dimensions, cFrequencies);
        const y2 = logScale(point.pitch, dimensions, cFrequencies);
        // x1이 1/3 지점 이하일 때 불투명도 조정
        ctx.globalAlpha = !isRealtime && x1 + 1 <= x0 ? 0.2 : 1.0;
        ctx.beginPath(); // 각 선마다 경로 시작
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      ctx.globalAlpha = 1.0; // 불투명도 초기화


      // if (isRealtime) {
      //   const startX = x0;
      //   const endX = 0;
      //   const currentY = logScale(data[currentTimeIndex]?.pitch, dimensions, cFrequencies);
      //   if (data[currentTimeIndex]?.pitch !== null) {
      //     ctx.beginPath();
      //     ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
      //     ctx.lineWidth = 10;
      //     ctx.moveTo(startX, currentY);
      //     ctx.lineTo(endX, currentY);
      //     ctx.stroke();
      //   }
      // }


      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    };
    // 참조 피치 데이터 그리기
    drawPitchData(referenceData, '#EEEEEE', 'grey', currentTimeIndex); // 흰색
    // 실시간 피치 데이터 그리기
    drawPitchData(realtimeData, '#FFA500', 'coral', currentTimeIndex, true); // 주황색
  }, [dimensions, referenceData, realtimeData, cFrequencies, dataPointCount, currentTimeIndex, graphWidth]);


  return (
    <>
      <canvas ref={dataCanvasRef} width={dimensions.width} height={dimensions.height} style={{ position: 'absolute', zIndex: 2 }} />
      <canvas ref={backgroundCanvasRef} width={dimensions.width} height={dimensions.height} style={{ position: 'absolute', zIndex: 1 }} />
    </>
  );
};
export default PitchGraph;
