/* eslint-env worker */
/* eslint-disable no-restricted-globals */

import { getFrequencyRange, logScale, stringToColor } from '../utils/GraphUtils';

let dataCanvas, backgroundCanvas, dataCtx, backgroundCtx, cFrequencies;
let referData = [];
let dimensions = { width: 1, height: 1 }; // 초기 dimensions 값 설정
let stars = [];
let starImage;
// cFrequencies 초기화 - getCFrequencies()가 undefined를 반환할 경우 빈 배열로 설정

const load = async () => {
  // Base64 인코딩된 이미지 데이터
  const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAMAAAApB0NrAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAbBQTFRFAAAA/9VI/9RG/9NB/9JB/9I+/9NF/9I//9I+/9I//9I//9I//9NB/9JD/9I+/9I+/9NA/9JA/9I+/9JA/9I//9I//9RH/9I+/9NC/9NB/9JA/9I//9I//9ld/9I//9I+/9NE/9NC/9NA/9ND/9NB/9NC/9NC/9NC/9NC/9NA/9I+/9I//9JA/9NC/9NC/9ND/9NA/9I//9I+/9I//9JA/9ND/9JA/9I+/9I+/9JA/9NF/9NB/9I//9I//9JA/9NE/9I//9I+/9I//9NE/9RG/9JA/9I+/9I+/9JA/9ND/9JB/9I//9I//9NB/9RJ/9I//9I+/9JA/9ND/9NE/9NB/9NA/9NE/9NA/9NE/9I//9I//9JA/9I+/9NC/9JA/9NA/9dW/9I//9I+/9I//9I+/9I//9NC/9NB/9I+/9JA/9RI/9JA/9I//9JA/9JA/9I//9NC/9JA/9I//9I//9I//9tl/9JB/9I+/9JB/9ND/9ND/9I//9NB/9JA/9I//9NB/9NC/9I//9JA/9JA/9RH/9I+/9RF/9I//9NE/9NC/9I//9ND/9RF/9ND/9ND/9NESA1K2QAAAJB0Uk5TAAwEdiLpG2T/Za2uBRHl8Sk//mmMsQrtFUFQjrgB1vUMKkdUgIB/fHpxarZveX5pILT7ujUEdfr9gQou0NhACZ/8rw4DTev4WgcjwscwA4b0mAsCTXkBWwSr1yruJGh1AbvmhOjaCxjROgE2vzRgpw6ResnrAU/jAxYZvSNinAsHeH1bAt8IwB4fviMTDQYTv9Qt4AAAAZRJREFUeJyF0E0ow3EYB/DnO2rampJFSFpumrhMLa05TEQcOMxL5GQlKS1iIUpemoakxU00tUSiuLiscHFRcvOShEgobbWa+b+Y/f+/bf89l+f3e/r8Xp4HxAaiCRW2oEIkrckEwumMGgilM5qfDHwrGx3CanwqmxwESfuubPTcO7o3RZOHL6JI7ouSKfjgv531pGSKhK/oHxVMMV75lI/71MbwLObCW5kphRji7kas6rOFpOKGFYpqUQlck0JoDNx5E3CZmnBXnPFvVOMiFTEh8PdnK0JJrzIDJxTrywbes2EFjojivTfgPMgQGw7Exf98moFjqSgrwS4xhlpxKDVN8FOCIfu+1NTFd3HThj2pafElMZ3YkRpN42ai6faTLOwbCaYH20LuALaERRfWWeO4C4iUCx8/qoqqFdYMCKccWCLq1Xr5dZ+HNc5Vov6rcrewGcYyN2fjnNyMLnLFj9PYCRe8wXrjtNyMu80WTMW7msQsuSbkpv3dgjFZ77U1aw8yMwOMEBPzwJDULMDJEiIPBoX8C0CxV4f87GCOAAAAAElFTkSuQmCC'; // Base64 문자열로 변경

  // Base64 문자열을 Blob으로 변환
  const response = await fetch(base64Image);
  const blob = await response.blob();

  // createImageBitmap으로 비트맵 생성 및 렌더링
  const imageBitmap = await createImageBitmap(blob);
  return imageBitmap;
}
self.onmessage = async (event) => {
  const data = event.data;
  // console.log("Received data:", data.dimensions);

  // canvas와 dimensions 초기화 여부 확인
  if (data.type == "init" && data.canvas) {

    dataCanvas = data.canvas;
    dataCtx = dataCanvas.getContext('2d');

    // 배경용 OffscreenCanvas 생성
    backgroundCanvas = new OffscreenCanvas(dataCanvas.width, dataCanvas.height);
    backgroundCtx = backgroundCanvas.getContext('2d');

    // setDimensions 함수로 캔버스 크기 업데이트
    setDimensions(data.dimensions);
    
    starImage = await load();
  }

  // 아래는 캔버스가 있어야만 수행하는 작업
  if (!dataCanvas) return;

  if (data.type == "refData") {
    if(!arraysEqual(referData, data.referenceData)){
      referData = data.referenceData;
      cFrequencies = getFrequencyRange(Math.min(...referData.filter(num => num > 0)), Math.max(...referData));
      
      updateBackground();
    }
  }
  else if(data.type == "timeData") {
    // 프레임을 그리는 함수 호출
    if (data.realtimeData && referData && Array.isArray(data.realtimeData) && Array.isArray(referData)) {
      drawFrame(
        data.realtimeData,
        data.multiRealDatas,
        referData,
        data.dataPointCount,
        data.currentTimeIndex,
        data.score
      );
    }
  }
  else if(data.type == "dimensionsData") {
    if (dimensions.width !== data.dimensions.width || dimensions.height !== data.dimensions.height) {
      setDimensions(data.dimensions);  // dataCanvas와 backgroundCanvas 모두 업데이트
      updateBackground();
    }
  }
};

const addStar = (x, y, score) => {
  // 새로운 별 객체 생성
  const speedX = (Math.random()-0.5)*4;
  const speedY = (Math.random()-0.5)*4;
  const speedAlpha = (Math.random()*0.02)+0.03;
  stars.push(
    { x: x,
      y: y, 
      alpha: 1.0, 
      speedX: speedX, 
      speedY: speedY, 
      speedAlpha: speedAlpha, // 떨어지는 속도 설정
      size: score,
    },
  );
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
  backgroundCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  backgroundCtx.fillRect(0, 0, dimensions.width, dimensions.height);
  drawGuidelinesAndLabels(backgroundCtx);
  
}

// 배열 검사
const arraysEqual = (arr1, arr2) => {
  if (!arr1 || !arr2) return false; // arr1 또는 arr2가 undefined인 경우 방어
  if (arr1.length !== arr2.length) return false; // 길이 먼저 확인
  return arr1.every((value, index) => value === arr2[index]);
};


// drawGuidelinesAndLabels 함수 수정
function drawGuidelinesAndLabels(targetCtx) {
  const graphWidth = dimensions.width;

  // 세로 구분선
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

  // 옥타브 라인과 레이블 그리기
  if (Array.isArray(cFrequencies)) {
    cFrequencies.forEach((freq, index) => {
      const y = logScale(freq, dimensions, cFrequencies);
      if (y === null) return;

      // 가이드라인
      targetCtx.beginPath();
      targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      targetCtx.lineWidth = 1;
      targetCtx.moveTo(0, y);
      targetCtx.lineTo(dimensions.width, y);
      targetCtx.stroke();

      // 레이블
      targetCtx.fillStyle = 'white';
      targetCtx.font = '12px Arial';
      targetCtx.textAlign = 'left';
      targetCtx.textBaseline = 'middle';
      
      // 옥타브 번호 계산 (C4를 기준으로)
      const octaveNumber = Math.round(Math.log2(freq/261.63)) + 4;
      targetCtx.fillText(`C${octaveNumber}`, 5, y);
      
    });
  }
}

function drawFrame(
  realtimeData,
  multiRealDatas,
  referenceData,
  dataPointCount,
  currentTimeIndex,
  score
) {
  if (!dataCtx) return; // dataCtx가 초기화되었는지 확인
  dataCtx.clearRect(0, 0, dimensions.width, dimensions.height);
  dataCtx.drawImage(backgroundCanvas, 0, 0);

  drawPitchData(referenceData, '#EEEEEE', 'grey', currentTimeIndex, false, dataPointCount, null);
  if (multiRealDatas) {
    Object.entries(multiRealDatas).forEach(([key, multiData]) => {
      if (key !== 'myId') {
        drawPitchData(multiData, stringToColor(key), 'coral', currentTimeIndex, true, dataPointCount, null);
      } else {
        drawPitchData(realtimeData, stringToColor(multiData), 'coral', currentTimeIndex, true, dataPointCount, score);
      }
    });
  } else {
    drawPitchData(realtimeData, '#FFA500', 'coral', currentTimeIndex, true, dataPointCount, score);
  }
}

function drawPitchData(
  data,
  color,
  glow = '',
  currentTimeIndex = 0,
  isRealtime = false,
  dataPointCount,
  score = 0,
) {
  if (!dataCtx || !Array.isArray(data)) return;

  const graphWidth = dimensions.width;
  dataCtx.strokeStyle = color;
  dataCtx.lineWidth = 3;

  // 그림자 효과 설정
  if (glow) {
    dataCtx.shadowColor = glow === 'coral' 
      ? 'rgba(255, 170, 150, 0.8)' 
      : 'rgba(200, 200, 200, 0.8)';
    dataCtx.shadowBlur = glow === 'coral' ? 5 : 3;
  }

  // 표시할 데이터 범위 계산
  const start = Math.max(0, Math.floor(currentTimeIndex) - dataPointCount);
  const visibleData = isRealtime 
    ? data.slice(start, currentTimeIndex + 1)
    : data.slice(start, Math.min(data.length, Math.floor(currentTimeIndex) + dataPointCount * 2));

  const windowSize = dataPointCount * 3;
  const pixelsPerIndex = graphWidth / windowSize;
  const x0 = graphWidth / 3;

  // 데이터 포인트 그리기
  visibleData.forEach((point, index) => {
    if (!point) return;
    
    const dataIndex = start + index;
    let prevPoint = data[dataIndex - 1];
    let indexDiff1 = dataIndex - 1 - currentTimeIndex;

    if (!prevPoint) {
      prevPoint = data[dataIndex - 2];
      if (!prevPoint) return;
      indexDiff1 = dataIndex - 2 - currentTimeIndex;
    }

    const indexDiff2 = dataIndex - currentTimeIndex;
    const x1 = x0 + indexDiff1 * pixelsPerIndex;
    const x2 = x0 + indexDiff2 * pixelsPerIndex;
    
    const y1 = logScale(prevPoint, dimensions, cFrequencies);
    const y2 = logScale(point, dimensions, cFrequencies);

    if (y1 === null || y2 === null) return;

    // 과거 데이터는 투명도 적용
    dataCtx.globalAlpha = (!isRealtime && (x1 + 1 <= x0)) ? 0.2 : 1.0;

    // 별 추가
    
    // 선 그리기
    dataCtx.beginPath();
    dataCtx.moveTo(x1, y1);
    dataCtx.lineTo(x2, y2);
    dataCtx.stroke();
    
  });
  if (score > 0.75 && referData[currentTimeIndex] && currentTimeIndex % 3 === 0) {
    addStar(x0, logScale(referData[currentTimeIndex], dimensions, cFrequencies), score);
  }

  stars = stars.filter(star => {
    const width = Math.floor(starImage.width * star.size**3 * 0.7);
    const height = Math.floor(starImage.height * star.size**3 * 0.7);
    dataCtx.globalAlpha = star.alpha;
    dataCtx.drawImage(starImage, star.x - width/2, star.y - height/2, width, height);

    star.x += star.speedX;
    star.y += star.speedY;
    star.alpha -= star.speedAlpha;
    return star.alpha > 0
  });

  // 그래픽 상태 초기화
  dataCtx.globalAlpha = 1.0;
  dataCtx.shadowBlur = 0;
  dataCtx.shadowColor = 'transparent';
}