// src/worker/pitchGraphWorker.js

/* eslint-env worker */
/* eslint-disable no-restricted-globals */

import { getCFrequencies, logScale } from '../utils/GraphUtils';

let canvas, ctx, dimensions, cFrequencies;
let songImageData = null;

self.onmessage = function (e) {
  const data = e.data;
  try {
    switch (data.type) {
      case 'init':
        canvas = data.canvas;
        ctx = canvas.getContext('2d');
        cFrequencies = getCFrequencies();
        break;
      case 'updateData':
        dimensions = data.dimensions;

        // songStateImageData를 수신
        if (data.songStateImageData) {
          songImageData = data.songStateImageData;
        }

        // OffscreenCanvas 크기 업데이트
        if (canvas.width !== dimensions.width || canvas.height !== dimensions.height) {
          canvas.width = dimensions.width;
          canvas.height = dimensions.height;
        }

        drawData(
          data.realtimeData,
          data.referenceData,
          data.dataPointCount,
          data.currentTimeIndex
        );
        break;
      default:
        break;
    }
  } catch (error) {
    // 에러 메시지 전송
    self.postMessage({ type: 'error', message: error.message });
  }
};

function drawData(
  realtimeData,
  referenceData,
  dataPointCount,
  currentTimeIndex
) {
  ctx.clearRect(0, 0, dimensions.width, dimensions.height);
  drawBackground();

  drawPitchData(referenceData, '#EEEEEE', 'grey', currentTimeIndex, false, dataPointCount);
  drawPitchData(realtimeData, '#FFA500', 'coral', currentTimeIndex, true, dataPointCount);
}

function drawBackground() {
  ctx.clearRect(0, 0, dimensions.width, dimensions.height);

  if (songImageData) {
    // songImageData는 ArrayBuffer 형태라고 가정
    const imageBlob = new Blob([songImageData], { type: 'image/jpeg' });

    createImageBitmap(imageBlob).then((imageBitmap) => {
      ctx.filter = 'blur(10px)';
      const imgHeight = imageBitmap.height;
      const imgWidth = imageBitmap.width;

      ctx.drawImage(
        imageBitmap,
        0,
        -(imgHeight + dimensions.height) / 2,
        dimensions.width,
        (imgHeight / imgWidth) * dimensions.width
      );
      ctx.filter = 'none';

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      drawGuidelinesAndLabels(ctx);
    }).catch((error) => {
      console.error('Error creating ImageBitmap:', error);
      // 이미지 로딩에 실패한 경우 기본 배경 처리
      drawDefaultBackground();
    });
  } else {
    // 이미지 데이터가 없는 경우 기본 배경 처리
    drawDefaultBackground();
  }
}

function drawDefaultBackground() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);
  drawGuidelinesAndLabels(ctx);
}

function drawGuidelinesAndLabels(ctx) {
  const graphWidth = dimensions.width;

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
}

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
    if (!point || point.pitch === null) return;
    const prevPoint = data[dataIndex - 1];
    if (!prevPoint || prevPoint.pitch === null) return;
    let indexDifference1 = dataIndex - 1 - currentTimeIndex;
    let indexDifference2 = dataIndex - currentTimeIndex;
    const x1 = x0 + indexDifference1 * pixelsPerIndex;
    const x2 = x0 + indexDifference2 * pixelsPerIndex;
    const y1 = logScale(prevPoint.pitch, dimensions, cFrequencies);
    const y2 = logScale(point.pitch, dimensions, cFrequencies);
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
