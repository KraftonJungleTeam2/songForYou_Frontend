import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import '../css/MultiPlay.css';
import AudioPlayer from "../components/AudioPlayer";

function MultiPlay() {
    const [players, setPlayers] = useState(Array(8).fill(null)); // 8자리 초기화
    const [isPlaying, setIsPlaying] = useState(false);
    const [userSeekPosition, setUserSeekPosition] = useState(0);
    const [audioLoaded, setAudioLoaded] = useState(false);
    const [duration, setDuration] = useState(0);

    const handlePlaybackPositionChange = (position) => {
        setUserSeekPosition(position);
    };

    return (
        <div className="multiPlay-page">
            <TopBar className="top-bar" />
            <div className="multi-content">
                <div className="players">
                    {players.map((player, index) => (
                        <div key={index} className="player-card">
                            {player ? (
                                <div>
                                    <p>{player.name}</p>
                                </div>
                            ) : (
                                <p>빈 자리</p>
                            )}
                        </div>
                    ))}
                </div>
                <div>
                  <AudioPlayer isPlaying={isPlaying} setIsPlaying={setIsPlaying} userSeekPosition={userSeekPosition} audioBlob={player.audioBlob} setAudioLoaded={setAudioLoaded}  setDuration={setDuration}  onPlaybackPositionChange={handlePlaybackPositionChange}/>
                </div>
            </div>
        </div>
    );
}

export default MultiPlay;
