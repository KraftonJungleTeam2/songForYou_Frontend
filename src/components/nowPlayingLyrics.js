import React from "react";

const NowPlayingLyrics = ({ segment, playbackPosition }) => {
  if (!segment?.words) return " ";

  const fullText = segment.words.map((word) => word.word.trim()).join(" ");

  const containerStyle = {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    position: "relative",
    fontSize: "2.8rem",
    lineHeight: "1.5",
    width: "100%", // 추가
    textAlign: "center", // 추가
  };

  return (
    <div className="curr-lyrics">
      <span className="curr-lyrics-back">{fullText}</span>
      <div className="curr-lyrics-highlight">
        {segment.words.map((wordData, index) => {
          const progress = Math.max(
            0,
            Math.min(
              1,
              (playbackPosition - wordData.start) /
                (wordData.end - wordData.start)
            )
          );

          return (
            <span
              key={index}
              className="current-lyrics"
              style={{
                clipPath: `inset(0 ${100 - progress * 100}% 0 0)`,
              }}
            >
              {wordData.word.trim()}
              {index < segment.words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default NowPlayingLyrics;
