import React, { useEffect, useRef } from 'react';

const getCFrequencies = () => {
  const octaves = Array.from({ length: 8 }, (_, i) => i + 1);
  return octaves.map(octave => 16.35 * Math.pow(2, octave));
};

const logScale = (value, dimensions, cFrequencies) => {
  const minValue = cFrequencies[0];
  const maxValue = cFrequencies[7];
  const minPixel = dimensions.height - 20;
  const maxPixel = 20;
  const logMin = Math.log(minValue);
  const logMax = Math.log(maxValue);
  const scale = (maxPixel - minPixel) / (logMax - logMin);
  return minPixel + scale * (Math.log(Math.max(value, minValue)) - logMin);
};

const PitchGraph = ({ dimensions, graphData }) => {
  const canvasRef = useRef(null);
  const cFrequencies = getCFrequencies();
  const graphWidth = dimensions.width / 3;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw vertical blue line
    ctx.beginPath();
    ctx.strokeStyle = '#0000FF';
    ctx.lineWidth = 2;
    ctx.moveTo(graphWidth, 20);
    ctx.lineTo(graphWidth, dimensions.height - 20);
    ctx.stroke();

    // Draw horizontal lines and labels
    cFrequencies.forEach((freq, index) => {
      const y = logScale(freq, dimensions, cFrequencies);

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

    // Draw pitch graph
    ctx.beginPath();
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 3.5;

    graphData.forEach((point, index) => {
      if (index === 0 || point.pitch === null) return;
      const prevPoint = graphData[index - 1];
      if (prevPoint.pitch === null) return;

      const x1 = graphWidth - (graphData.length - index + 1) * (graphWidth / 100);
      const x2 = graphWidth - (graphData.length - index) * (graphWidth / 100);
      const y1 = logScale(prevPoint.pitch, dimensions, cFrequencies);
      const y2 = logScale(point.pitch, dimensions, cFrequencies);

      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    });
    ctx.stroke();

  }, [dimensions, graphData]);

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