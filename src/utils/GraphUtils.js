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
  const c = [55.0, 58.27047018976124, 61.735412657015516, 65.40639132514967, 69.29565774421803, 73.41619197935191, 77.78174593052024, 82.40688922821751, 87.307057858251, 92.49860567790863, 97.99885899543736, 103.82617439498632,
    110.0, 116.54094037952252, 123.47082531403107, 130.81278265029937, 138.5913154884361, 146.83238395870384, 155.56349186104052, 164.81377845643505, 174.61411571650203, 184.99721135581729, 195.99771799087475, 207.65234878997268,
    220.0, 233.08188075904508, 246.9416506280622, 261.6255653005988, 277.1826309768723, 293.6647679174078, 311.1269837220812, 329.62755691287026, 349.2282314330042, 369.9944227116348, 391.9954359817497, 415.3046975799456,
    440.0, 466.1637615180905, 493.88330125612475, 523.2511306011979, 554.365261953745, 587.3295358348159, 622.2539674441628, 659.2551138257409, 698.4564628660089, 739.98884542327, 783.9908719634999, 830.6093951598917,
    880.0, 932.3275230361816, 987.7666025122501, 1046.5022612023965, 1108.7305239074906, 1174.6590716696326, 1244.5079348883262, 1318.5102276514824, 1396.9129257320185, 1479.9776908465408, 1567.9817439270007, 1661.2187903197844,
    1760.0];
  const s = ['A1', 'A#1', 'B1', 'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2',
    'A2', 'A#2', 'B2', 'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3',
    'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4',
    'A4', 'A#4', 'B4', 'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5',
    'A5', 'A#5', 'B5', 'C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6',
    'A6'];

  let i_min = 0
  let i_max = c.length;
  for (let i = 1; i < c.length; i++) {
    if (minFrequency > c[i]) {
      i_min++;
    }
    else if (maxFrequency < c[i]) {
      i_max = i+1;
      break;
    }
  }
  const frequencies = c.slice(i_min, i_max);
  const scales = s.slice(i_min, i_max);

  return [frequencies, scales];
};

// 로그 스케일 변환 함수
export const logScale = (value, dimensions, frequencies) => {
  if (!value || value <= 0) return null;
  
  const minValue = frequencies[0];
  const maxValue = frequencies[frequencies.length - 1];
  const minPixel = dimensions.height - 20; // 하단 여백
  const maxPixel = 20; // 상단 여백
  
  // 로그 스케일 변환
  const logValue = Math.log2(value);
  const logMin = Math.log2(minValue);
  const logMax = Math.log2(maxValue);
  
  // 픽셀 값으로 변환
  return minPixel - ((logValue - logMin) / (logMax - logMin)) * (minPixel - maxPixel);
};
