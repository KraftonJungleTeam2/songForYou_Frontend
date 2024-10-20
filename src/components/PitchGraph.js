// PitchGraph.js
import React, { useEffect, useRef } from 'react';
import { getCFrequencies, logScale } from '../utils/GraphUtils';

const PitchGraph = ({ dimensions, referenceData, realtimeData }) => {
  const backgroundCanvasRef = useRef(null);
  const dataCanvasRef = useRef(null);
  const cFrequencies = getCFrequencies();
  const graphWidth = dimensions.width / 3;

  // 배경 그리기
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear background canvas
    ctx.fillStyle = 'rgba(0, 0, 0)'; // 반투명 검정 배경
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw horizontal lines and labels
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
      ctx.fillText(`C${index + 1}`, 15, y);
    });
  }, [dimensions, cFrequencies]);

  // 실시간 및 참조 데이터 그리기
  useEffect(() => {
    const canvas = dataCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear data canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Function to draw pitch data
    const drawPitchData = (data, color, startpoint) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;

      data.forEach((point, index) => {
        if (index === 0 || point.pitch === null) return;
        const prevPoint = data[index - 1];
        if (prevPoint.pitch === null) return;

        const x1 = startpoint - (data.length - index + 1) * (graphWidth / 100);
        const x2 = startpoint - (data.length - index) * (graphWidth / 100);
        const y1 = logScale(prevPoint.pitch, dimensions, cFrequencies);
        const y2 = logScale(point.pitch, dimensions, cFrequencies);

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      });
      ctx.stroke();

      // Draw vertical blue line
      ctx.beginPath();
      ctx.strokeStyle = '#0000FF';
      ctx.lineWidth = 5;
      ctx.moveTo(graphWidth, 20);
      ctx.lineTo(graphWidth, dimensions.height - 20);
      ctx.stroke();

    };

    // Draw reference pitch graph
    drawPitchData(realtimeData, '#FFA500', graphWidth);  // Orange color for reference data
    // Draw realtime pitch graph
    drawPitchData(referenceData, '#00FF00', dimensions.width);  // Green color for realtime data
  }, [dimensions, referenceData, realtimeData, cFrequencies]);

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
