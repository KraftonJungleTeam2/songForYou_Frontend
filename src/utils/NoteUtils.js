const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const getNote = (frequency) => {
  const c0 = 16.35;
  const halfStepsBelowMiddleC = Math.round(12 * Math.log2(frequency / c0));
  const octave = Math.floor(halfStepsBelowMiddleC / 12);
  const noteIndex = halfStepsBelowMiddleC % 12;
  return notes[noteIndex] + octave;
};