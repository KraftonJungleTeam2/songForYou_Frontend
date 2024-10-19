// PitchGraph.js
import React, { useEffect, useRef, useState  } from 'react';
import { getCFrequencies, logScale } from '../utils/GraphUtils';

const PitchGraph = ({ dimensions, referenceData, realtimeData }) => {
  const canvasRef = useRef(null);
  const cFrequencies = getCFrequencies();
  const graphWidth = dimensions.width / 3;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

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
    };

    // Draw reference pitch graph
    drawPitchData(realtimeData, '#FFA500', graphWidth);  // Green color for realtime data
    
    drawPitchData(referenceData, '#00FF00', dimensions.width);  // Orange color for reference data

    // Draw realtime pitch graph

    // Draw vertical blue line
    ctx.beginPath();
    ctx.strokeStyle = '#0000FF';
    ctx.lineWidth = 5;
    ctx.moveTo(graphWidth, 20);
    ctx.lineTo(graphWidth, dimensions.height - 20);
    ctx.stroke();

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
  }, [dimensions, referenceData, realtimeData]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      style={{ overflow: 'visible' }}
    />
  );
};

export default PitchGraph;