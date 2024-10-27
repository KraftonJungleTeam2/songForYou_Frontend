import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import '../css/MultiPlay.css'


function MultiPlay() {
    const [players, setPlayers] = useState(Array(8).fill(null)); // 8자리 초기화

    // setPlayers(updatedPlayers.slice(0, 8)); // 항상 8개의 자리 유지
    return (
        <div className="multiPlay-page">
            <TopBar className="top-bar" />
            <div className="multi-content">
                <div className="players">
                    {players.map((player, index) => (
                        <div key={index} className="player-card">
                            {player ? <p>{player.name}</p> : <p>빈 자리</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MultiPlay;
