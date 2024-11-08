import React, { useState } from "react";
import '../css/ReservationPopup.css'

const ReservationPopup = ({
  roomid,
  socket,
  onClose,
  reservedSongs,
  songLists,
}) => {
  const [viewType, setViewType] = useState("public");
  const [searchTerm, setSearchTerm] = useState("");
  // const { roomid } = useParams(); // URL에서 songId 추출

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

  const isReserved = (song) => reservedSongs.includes(song); // 예약 여부 확인

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
        <div className="song-list-area" style={{borderRight: "3px solid var(--border-gray)", borderRadius: 0}}>
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
              <button className="button is-dark">
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
                    style={{ width: "8rem" }}
                  >
                    <button
                      className={`button is-dark`}
                      disabled={isReserved(song)}
                      onClick={(e) =>
                        !isReserved(song) && handleReserve(e, song)
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

        <button className="button" onClick={onClose} style={{width: '95%', marginLeft: '2.5%'}}>
          닫기
        </button>
        </div>
        <div className="reserve-list">
          hi
        </div>
      </div>


    </div>
  );
};


export default ReservationPopup;
