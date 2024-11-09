import React, { useState } from "react";
import '../css/ReservationPopup.css';

const ReservationPopup = ({
  roomid,
  socket,
  onClose,
  reservedSongs,
  songLists,
  isPlaying,
}) => {
  const [viewType, setViewType] = useState("public");
  const [searchTerm, setSearchTerm] = useState("");

  const handleTabClick = (view) => {
    setViewType(view);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleReserve = (e, song) => {
    e.stopPropagation();
    console.log(song);
    socket.emit("reserveSong", { song: song, roomId: roomid });
  };

  const handleRemove = (id) => {
    socket.emit("cancelReservation", {
      roomId: roomid,
      songId: id,
    });
  };

  const isReserved = (id) => reservedSongs.some(reserved => reserved.songId === id);

  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  const filteredSongs = (
    viewType === "public" ? songLists.public : songLists.private
  ).filter((song) =>
    song.metadata.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="overlay">
      <div className="popup">
        <div className="song-list-area" style={{borderRight: "2px solid var(--border-gray)", borderRadius: 0, paddingRight: '1vw'}}>
          <div className="top-section">
            <div
              className="tabs"
              style={{ paddingBottom: "1px", margin: "0rem auto 0rem 0rem" }}
            >
              <li
                className={viewType === "public" ? "is-active" : ""}
                onClick={() => handleTabClick("public")}
              >
                <a>공개 노래</a>
              </li>
              <li
                className={viewType === "private" ? "is-active" : ""}
                onClick={() => handleTabClick("private")}
              >
                <a>내 노래</a>
              </li>
            </div>

            <div className="search-bar">
              <input
                type="text"
                placeholder="노래 검색"
                value={searchTerm}
                onChange={handleSearch}
              />
              <button className="search-button">
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </div>
          </div>

          <div className="song-list" style={{marginBottom: "2vh"}}>
            {filteredSongs.length === 0 ? (
              <p>노래가 없습니다.</p>
            ) : (
              filteredSongs.map((song) => (
                <div key={song.id} className="song-item">
                  <div
                    className="song-icon"
                    style={{
                      backgroundImage: `url(data:image/jpeg;base64,${arrayBufferToBase64(
                        song.image.data
                      )})`,
                      backgroundSize: "cover",
                      backgroundRepeat: "no-repeat",
                      width: "4rem",
                      height: "4rem",
                    }}
                    alt={song.metadata.title}
                  />

                  <div className="song-info has-text-left">
                    <h3>{song.metadata.title}</h3>
                    <p>{song.metadata.description}</p>
                    <span className="timestamp">{song.timestamp}</span>
                  </div>

                  <div
                    className="buttons has-addons is-right"
                  >
                    <button
                      className={`button is-dark`}
                      disabled={isReserved(song.id)}
                      onClick={(e) =>
                        !isReserved(song.id) && handleReserve(e, song)
                      }
                      style={{ height: "2.2rem", width: "3rem" }}
                    >
                      {isReserved(song.id) ? (
                        <i className="fa-solid fa-check"></i>
                      ) : (
                        <i className="fa-solid fa-plus"></i>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="close-button-pop"onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="reserve-list-area">
          <h2 className="reserve-list-title">예약 리스트</h2>
          <div className="reserve-list">
            {reservedSongs.length === 0 ? (
              <p>노래가 없습니다.</p>
            ) : (
              reservedSongs.map((reserved, index) => (
                <div className={`song-item ${index === 0 ? 'highlighted-border' : ''} ${index === 0 && isPlaying ? 'playing-overlay' : ''}`}>
                  <div
                    className="song-icon"
                    style={{
                      backgroundImage: `url(data:image/jpeg;base64,${arrayBufferToBase64(
                        reserved.song.image.data
                      )})`,
                      backgroundSize: "cover",
                      backgroundRepeat: "no-repeat",
                      width: "4rem",
                      height: "4rem",
                    }}
                    alt={reserved.song.metadata.title}
                  />

                  <div className="song-info has-text-left">
                    <h3>{reserved.song.metadata.title}</h3>
                    <p>{reserved.song.metadata.description}</p>
                  </div>

                  <div
                    className="buttons has-addons is-right"
                  >
                    <button
                      className={`button is-danger`}
                      disabled={index === 0 && isPlaying}
                      onClick={() => handleRemove(reserved.song.id)}
                      style={{ height: "2.2rem", width: "3rem" }}
                    >
                      {index === 0 && isPlaying ? "진행 중" : <i className="fa-solid fa-trash"></i>}
                    </button>
                  </div>
                  
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPopup;
