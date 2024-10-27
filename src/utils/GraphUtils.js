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
  