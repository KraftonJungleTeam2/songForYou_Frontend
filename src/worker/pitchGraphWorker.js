/* eslint-env worker */
/* eslint-disable no-restricted-globals */

import { getCFrequencies, logScale } from '../utils/GraphUtils';

let canvas, ctx, dimensions, cFrequencies;
let songImageData = null;
let backgroundCanvas = null;
let backgroundCtx = null;
let lastDimensions = null;
let backgroundNeedsUpdate = true;

self.onmessage = (event) => {
  const data = event.data;

  // 초기화
  if (data.canvas) {
    canvas = data.canvas;
    ctx = canvas.getContext('2d');
    cFrequencies = getCFrequencies();
    dimensions = data.dimensions;

    // 배경용 OffscreenCanvas 생성
    backgroundCanvas = new OffscreenCanvas(canvas.width, canvas.height);
    backgroundCtx = backgroundCanvas.getContext('2d');
  } else {
    const dimensionsChanged = !lastDimensions ||
      lastDimensions.width !== data.dimensions.width ||
      lastDimensions.height !== data.dimensions.height;

    dimensions = data.dimensions;

    // 크기가 변경되었을 때 캔버스 크기 조정
    if (dimensionsChanged) {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      backgroundCanvas.width = dimensions.width;
      backgroundCanvas.height = dimensions.height;
      backgroundNeedsUpdate = true;
      lastDimensions = { ...dimensions };
    }

    // songStateImageData가 변경되었을 때
    if (data.songStateImageData !== songImageData) {
      songImageData = data.songStateImageData;
      backgroundNeedsUpdate = true;
    }

    // 배경 업데이트가 필요한 경우에만 배경 다시 그리기
    if (backgroundNeedsUpdate) {
      updateBackground();
      backgroundNeedsUpdate = false;
    }

    drawFrame(
      data.realtimeData,
      data.referenceData,
      data.dataPointCount,
      data.currentTimeIndex
    );
  }
};

function updateBackground() {
  backgroundCtx.clearRect(0, 0, dimensions.width, dimensions.height);

  if (songImageData) {
    const imageBlob = new Blob([songImageData], { type: 'image/jpeg' });

    createImageBitmap(imageBlob).then((imageBitmap) => {
      backgroundCtx.filter = 'blur(10px)';
      // const imgHeight = imageBitmap.height;
      // const imgWidth = imageBitmap.width;

      backgroundCtx.filter = 'none';

      backgroundCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      backgroundCtx.fillRect(0, 0, dimensions.width, dimensions.height);

      drawGuidelinesAndLabels(backgroundCtx);
    }).catch((error) => {
      console.error('Error creating ImageBitmap:', error);
      drawDefaultBackground(backgroundCtx);
    });
  } else {
    drawDefaultBackground(backgroundCtx);
  }
}

function drawDefaultBackground(targetCtx) {
  targetCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  targetCtx.fillRect(0, 0, dimensions.width, dimensions.height);
  drawGuidelinesAndLabels(targetCtx);
}

function drawGuidelinesAndLabels(targetCtx) {
  const graphWidth = dimensions.width;

  targetCtx.beginPath();
  targetCtx.strokeStyle = '#EEEEEE';
  targetCtx.lineWidth = 4;
  targetCtx.shadowColor = 'rgba(255, 170, 150, 0.8)';
  targetCtx.shadowBlur = 10;
  targetCtx.moveTo(graphWidth / 3, 0);
  targetCtx.lineTo(graphWidth / 3, dimensions.height);
  targetCtx.stroke();

  targetCtx.shadowBlur = 0;
  targetCtx.shadowColor = 'transparent';

  cFrequencies.forEach((freq, index) => {
    const y = logScale(freq, dimensions, cFrequencies);
    targetCtx.lineWidth = 2;
    targetCtx.beginPath();
    targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    targetCtx.moveTo(0, y);
    targetCtx.lineTo(dimensions.width, y);
    targetCtx.stroke();

    targetCtx.fillStyle = 'white';
    targetCtx.font = '10px Arial';
    targetCtx.textBaseline = 'middle';
    targetCtx.fillText(`C${index + 2}`, 15, y);
  });
}

function drawFrame(
  realtimeData,
  referenceData,
  dataPointCount,
  currentTimeIndex
) {
  ctx.clearRect(0, 0, dimensions.width, dimensions.height);

  // 캐시된 배경 그리기
  ctx.drawImage(backgroundCanvas, 0, 0);

  // 데이터 그리기
  drawPitchData(referenceData, '#EEEEEE', 'grey', currentTimeIndex, false, dataPointCount);
  drawPitchData(realtimeData, '#FFA500', 'coral', currentTimeIndex, true, dataPointCount);
}

// drawPitchData 함수는 기존과 동일
function drawPitchData(
  data,
  color,
  glow = '',
  currentTimeIndex = 0,
  isRealtime = false,
  dataPointCount
) {
  const graphWidth = dimensions.width;
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
    start = Math.max(0, Math.floor(currentTimeIndex) - dataPointCount);
    end = Math.min(data.length, Math.floor(currentTimeIndex) + dataPointCount * 2);
    visibleData = data.slice(start, end);
  } else {
    start = Math.max(0, Math.floor(currentTimeIndex) - dataPointCount);
    visibleData = data.slice(start, currentTimeIndex + 1);
  }
  const windowSize = dataPointCount * 3;
  const pixelsPerIndex = graphWidth / windowSize;
  const x0 = graphWidth / 3;
  visibleData.forEach((point, index) => {
    const dataIndex = start + index;
    if (!point || point === null) return;
    let prevPoint = data[dataIndex - 1];
    let indexDifference1 = dataIndex - 1 - currentTimeIndex;
    if (!prevPoint || prevPoint === null) {
      prevPoint = data[dataIndex - 2];
      if (!prevPoint || prevPoint === null) {
        return;
      } else {
        indexDifference1 = dataIndex - 2 - currentTimeIndex;
      }
    }
    let indexDifference2 = dataIndex - currentTimeIndex;
    const x1 = x0 + indexDifference1 * pixelsPerIndex;
    const x2 = x0 + indexDifference2 * pixelsPerIndex;
    const y1 = logScale(prevPoint, dimensions, cFrequencies);
    const y2 = logScale(point, dimensions, cFrequencies);
    ctx.globalAlpha = !isRealtime && x1 + 1 <= x0 ? 0.2 : 1.0;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}