/* eslint-env worker */
/* eslint-disable no-restricted-globals */

import { getCFrequencies, logScale } from '../utils/GraphUtils';

let dataCanvas, backgroundCanvas, dataCtx, backgroundCtx, cFrequencies;
let songURL = null;
let dimensions = { width: 1, height: 1 }; // 초기 dimensions 값 설정

// cFrequencies 초기화 - getCFrequencies()가 undefined를 반환할 경우 빈 배열로 설정
cFrequencies = getCFrequencies() || [];

self.onmessage = (event) => {
  const data = event.data;
  // console.log("Received data:", data.dimensions);

  // canvas와 dimensions 초기화 여부 확인
  if (data.canvas) {

    dataCanvas = data.canvas;
    dataCtx = dataCanvas.getContext('2d');

    // 배경용 OffscreenCanvas 생성
    backgroundCanvas = new OffscreenCanvas(dataCanvas.width, dataCanvas.height);
    backgroundCtx = backgroundCanvas.getContext('2d');

    // setDimensions 함수로 캔버스 크기 업데이트
    setDimensions(data.dimensions);
    updateBackground();
  }

  // dimensions 값이 변경되었는지 확인
  else if (dimensions.width !== data.dimensions.width || dimensions.height !== data.dimensions.height) {

    // console.log("Updating dimensions:", data.dimensions);
    setDimensions(data.dimensions);  // dataCanvas와 backgroundCanvas 모두 업데이트
    updateBackground();
  }

  // 이미지 정보 읽기
  if (data.songURL && data.songURL !== songURL) {
    songURL = data.songURL;
    console.log('이미지 데이터 수신:', songURL);
    updateBackground(); // 이미지 데이터를 받은 후 배경 업데이트
  }

  // 프레임을 그리는 함수 호출
  if (data.realtimeData && data.referenceData && Array.isArray(data.realtimeData) && Array.isArray(data.referenceData)) {
    drawFrame(
      data.realtimeData,
      data.multiRealDatas,
      data.referenceData,
      data.dataPointCount,
      data.currentTimeIndex
    );
  }
};

// dataCanvas와 backgroundCanvas 크기를 동기화하는 함수
function setDimensions(newDimensions) {
  dimensions = newDimensions;  // 전달받은 dimensions로 설정
  // dataCanvas와 backgroundCanvas가 초기화되었는지 확인 후 크기 업데이트
  if (dataCanvas && backgroundCanvas) {
    dataCanvas.width = dimensions.width;
    dataCanvas.height = dimensions.height;
    backgroundCanvas.width = dimensions.width;
    backgroundCanvas.height = dimensions.height;
  }
}

async function updateBackground() {
  if (!backgroundCtx) return; // backgroundCtx가 초기화되었는지 확인

  backgroundCtx.clearRect(0, 0, dimensions.width, dimensions.height);

  if (songURL) {
    try {
      console.log('배경 이미지 그리기 시작');
      const response = await fetch(songURL);
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);
      console.log(imageBitmap);

      imageBitmap.width = dimensions.width;
      imageBitmap.height = dimensions.height;
      backgroundCtx.filter = 'blur(10px)';
      backgroundCtx.drawImage(imageBitmap, 0, 0, dimensions.width, dimensions.height);
      // backgroundCtx.filter = 'none';
      backgroundCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      backgroundCtx.fillRect(0, 0, dimensions.width, dimensions.height);
      drawGuidelinesAndLabels(backgroundCtx);
    } catch (error) {
      console.error('Error creating ImageBitmap:', error);
      drawDefaultBackground(backgroundCtx);
    }
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

  // cFrequencies가 배열인지 확인
  if (Array.isArray(cFrequencies)) {
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
}

function drawFrame(
  realtimeData,
  multiRealDatas,
  referenceData,
  dataPointCount,
  currentTimeIndex
) {
  if (!dataCtx) return; // dataCtx가 초기화되었는지 확인
  dataCtx.clearRect(0, 0, dimensions.width, dimensions.height);
  dataCtx.drawImage(backgroundCanvas, 0, 0);

  drawPitchData(referenceData, '#EEEEEE', 'grey', currentTimeIndex, false, dataPointCount);
  drawPitchData(realtimeData, '#FFA500', 'coral', currentTimeIndex, true, dataPointCount);
  //  다른 참가자 데이터 그리기
  if (multiRealDatas) {
    Object.values(multiRealDatas).forEach((multiData) => {
      drawPitchData(multiData, '#FFFFFF', 'coral', currentTimeIndex, true, dataPointCount);
    });
  }
}

function drawPitchData(
  data,
  color,
  glow = '',
  currentTimeIndex = 0,
  isRealtime = false,
  dataPointCount
) {
  if (!dataCtx) return; // dataCtx가 초기화되었는지 확인
  if (!Array.isArray(data)) return; // data가 배열인지 확인

  const graphWidth = dimensions.width;
  dataCtx.strokeStyle = color;
  dataCtx.lineWidth = 3.5;

  if (glow === 'coral') {
    dataCtx.shadowColor = 'rgba(255, 170, 150, 0.8)';
    dataCtx.shadowBlur = 5;
  } else if (glow === 'grey') {
    dataCtx.shadowColor = 'rgba(200, 200, 200, 0.8)';
    dataCtx.shadowBlur = 3;
  } else {
    dataCtx.shadowBlur = 0;
    dataCtx.shadowColor = 'transparent';
  }

  let start = 0;
  let visibleData = [];

  if (!isRealtime) {
    start = Math.max(0, Math.floor(currentTimeIndex) - dataPointCount);
    const end = Math.min(data.length, Math.floor(currentTimeIndex) + dataPointCount * 2);
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
    if (!point) return;

    let prevPoint = data[dataIndex - 1];
    let indexDifference1 = dataIndex - 1 - currentTimeIndex;

    if (!prevPoint) {
      prevPoint = data[dataIndex - 2];
      if (!prevPoint) {
        return;
      } else {
        indexDifference1 = dataIndex - 2 - currentTimeIndex;
      }
    }

    const indexDifference2 = dataIndex - currentTimeIndex;
    const x1 = x0 + indexDifference1 * pixelsPerIndex;
    const x2 = x0 + indexDifference2 * pixelsPerIndex;
    const y1 = logScale(prevPoint, dimensions, cFrequencies);
    const y2 = logScale(point, dimensions, cFrequencies);

    dataCtx.globalAlpha = (!isRealtime && (x1 + 1 <= x0)) ? 0.2 : 1.0;

    dataCtx.beginPath();
    dataCtx.moveTo(x1, y1);
    dataCtx.lineTo(x2, y2);
    dataCtx.stroke();
  });

  dataCtx.globalAlpha = 1.0;
  dataCtx.shadowBlur = 0;
  dataCtx.shadowColor = 'transparent';
}
