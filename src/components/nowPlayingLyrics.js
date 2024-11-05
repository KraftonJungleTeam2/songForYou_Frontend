import React from 'react';

const NowPlayingLyrics = ({ segment, playbackPosition }) => {
  if (!segment?.words) return null;

  return (
    <div className="text-2xl font-bold whitespace-pre-wrap break-words">
      {segment.words.map((wordData, index) => {
        const progress = Math.max(0, Math.min(1, 
          (playbackPosition - wordData.start) / (wordData.end - wordData.start)
        ));
        
        return (
          <span 
            key={index}
            className="current-lyrics relative inline-block"
            style={{
              clipPath: `inset(0 ${100 - (progress * 100)}% 0 0)`,
            }}
          >
            {wordData.word}
            {/* 마지막 단어가 아닌 경우에만 공백 추가 */}
            {index < segment.words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};

export default NowPlayingLyrics;