import React, { useState, useEffect } from "react";
import "../css/Single.css";
import SongListArea from "../components/SongListArea";
import Preview from "../components/Preview";
import { useSongs } from "../Context/SongContext";
import { useScreen } from "../Context/ScreenContext";
import PageTemplate from "../template/PageTemplate";

function Single() {
  const [selectedSong, setSelectedSong] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { songLists, fetchSongLists } = useSongs();
  const { isMobile } = useScreen();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSongSelect = (song) => {
    setSelectedSong(song);
  };

  useEffect(() => {
    
    fetchSongLists();
    console.log(songLists);
  }, []);

  return (
    <PageTemplate
      isMobile={isMobile}
      isSidebarOpen={isSidebarOpen}
      toggleSidebar={toggleSidebar}
      current={"single"}
    >
      {isMobile ? (
        <>
          {/* 모바일 환경에서는 Preview가 위에 표시되도록 순서 변경 */}
          <div className="preview-container component-container">
            <Preview selectedSong={selectedSong} />
          </div>
          <div className="song-list-area-container component-container">
            <SongListArea
              onSongSelect={handleSongSelect}
              publicSongs={songLists.public}
              privateSongs={songLists.private}
            />
          </div>
        </>
      ) : (
        <>
          {/* 데스크톱 환경에서는 SongListArea가 왼쪽, Preview가 오른쪽에 위치 */}
          <div className="song-list-area-container component-container">
            <SongListArea
              onSongSelect={handleSongSelect}
              publicSongs={songLists.public}
              privateSongs={songLists.private}
            />
          </div>
          <div className="preview-container component-container">
            <Preview selectedSong={selectedSong} />
          </div>
        </>
      )}
    </PageTemplate>
  );
}

export default Single;
