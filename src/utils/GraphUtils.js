export const getCFrequencies = () => {
    const octaves = Array.from({ length: 8 }, (_, i) => i + 1);
    return octaves.map(octave => 16.35 * Math.pow(2, octave));
  };
  
  export const logScale = (value, dimensions, cFrequencies) => {
    const minValue = cFrequencies[0];
    const maxValue = cFrequencies[7];
    const minPixel = dimensions.height - 20;
    const maxPixel = 20;
    const logMin = Math.log(minValue);
    const logMax = Math.log(maxValue);
    const scale = (maxPixel - minPixel) / (logMax - logMin);
    return minPixel + scale * (Math.log(Math.max(value, minValue)) - logMin);
  };