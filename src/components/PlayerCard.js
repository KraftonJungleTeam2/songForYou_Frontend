// src/components/PlayerCard.js
import React from "react";
import "../css/PlayerCard.css";
import { stringToColor } from "../utils/GraphUtils";

function PlayerCard({ players, socketId, score, playerVolumeChange }) {
  return (
    <div className="player-cards-container">
      {Array(4)
        .fill(null)
        .map((_, index) => (
          <div
            key={index}
            className={`player-card ${
              players[index]?.isAudioActive ? "active" : ""
            } ${players[index]?.mic ? 'has-mic' : ''}`}
          >
            {players[index] ? (
              <div className="player-info">
                {/* 색깔 표시 영역 */}
                <div className="color-display">
                  <div
                    className="color-circle"
                    style={{
                      backgroundColor: stringToColor(players[index].userId),
                    }}
                  ></div>
                </div>
                {/* 프로필 사진 영역 */}
                {/* <div className="profile-picture">
                  <img src={players[index].profilePictureUrl || '/default-profile.png'} alt={`${players[index].name}'s profile`} />
                </div> */}

                {/* 플레이어 상세 정보 */}
                <div className="details">
                  <p className="player-details">
                    <span className="player-name">
                      {players[index].name} {players[index].mic ? "🎤" : ""}
                    </span>
                    <span className="score">
                      {players[index].userId === socketId.current
                        ? score
                        : players[index].score}
                      점
                    </span>
                  </p>
                  {players[index].userId !== socketId.current ? (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={players[index].volume}
                      onChange={playerVolumeChange(players[index].userId)}
                      className="range-slider"
                    />
                  ) : null}
                </div>
              </div>
            ) : (
              <p style={{color: 'grey'}}>빈 자리</p>
            )}
          </div>
        ))}
    </div>
  );
}

export default PlayerCard;
