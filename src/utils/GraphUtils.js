export function stringToColor(str) {
  let hash = 0;
  // 문자열의 각 문자를 해시값으로 변환
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // 해시값을 6자리 HEX 코드로 변환
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).slice(-2);
  }

  return color;
}
// 주파수 범위 생성 함수
export const getFrequencyRange = (minFrequency, maxFrequency) => {
  // C0부터 C8까지의 기준 주파수 (C4 = 261.63Hz)
  const baseFreq = 261.63; // C4
  const frequencies = [];
  
  // 최소 주파수가 속한 옥타브 찾기
  let minOctave = Math.floor(Math.log2(minFrequency/baseFreq)) + 4;
  // 최대 주파수가 속한 옥타브 찾기
  let maxOctave = Math.ceil(Math.log2(maxFrequency/baseFreq)) + 4;
  
  // 안전을 위해 범위 제한 (C0 ~ C8)
  minOctave = Math.max(0, minOctave - 1); 
  maxOctave = Math.min(8, maxOctave); 
  
  // 각 옥타브의 C음 주파수 생성
  for (let octave = minOctave; octave <= maxOctave; octave++) {
    frequencies.push(baseFreq * Math.pow(2, octave - 4));
  }
  
  return frequencies;
};

// 로그 스케일 변환 함수
export const logScale = (value, dimensions, cFrequencies) => {
  if (!value || value <= 0) return null;
  
  const minValue = cFrequencies[0];
  const maxValue = cFrequencies[cFrequencies.length - 1];
  const minPixel = dimensions.height - 20; // 하단 여백
  const maxPixel = 20; // 상단 여백
  
  // 로그 스케일 변환
  const logValue = Math.log2(value);
  const logMin = Math.log2(minValue);
  const logMax = Math.log2(maxValue);
  
  // 픽셀 값으로 변환
  return minPixel - ((logValue - logMin) / (logMax - logMin)) * (minPixel - maxPixel);
};
