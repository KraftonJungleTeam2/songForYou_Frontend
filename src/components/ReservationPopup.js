import { useEffect, useState, useRef } from 'react';
import ReservationList from './ReservationList';
import { useSongs } from '../Context/SongContext';

const ReservationPopup = ({ onClose }) => {

    const [selectedSong, setSelectedSong] = useState(null);
    const { songLists, fetchSongLists } = useSongs();
    
    // songContext에서 노래 정보를 불러옴
    useEffect(() => {
        fetchSongLists();
    }, []);

    const handleSongSelect = (song) => {
        setSelectedSong(song);
      };
      
  return (
    <div style={styles.overlay}>
      <div style={styles.popup}>
        <h2>예약 정보</h2>
        <p>여기에 예약 정보를 입력하거나 확인할 수 있습니다.</p>
        <ReservationList onSongSelect={handleSongSelect} publicSongs={songLists.public} privateSongs={songLists.private}></ReservationList>
        <button className='button' onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popup: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    width: '300px',
    textAlign: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
};

export default ReservationPopup;
