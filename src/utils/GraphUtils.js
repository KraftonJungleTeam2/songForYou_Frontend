export const getCFrequencies = () => {
  const octaves = Array.from({ length: 6 }, (_, i) => i);
  return octaves.map(octave => 65.40639 * Math.pow(2, octave));
};

export const logScale = (value, dimensions, cFrequencies) => {
  if (value === 0) return null; // value가 0이면 null 반환

  const minValue = cFrequencies[0];
  const maxValue = cFrequencies[5];
  const minPixel = dimensions.height - 20;
  const maxPixel = 20;
  const logMin = Math.log(minValue);
  const logMax = Math.log(maxValue);
  const scale = (maxPixel - minPixel) / (logMax - logMin);

  return minPixel + scale * (Math.log(Math.max(value, minValue)) - logMin);
};

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