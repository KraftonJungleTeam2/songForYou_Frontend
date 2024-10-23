import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Context 생성
const SongContext = createContext();

// Provider 생성
export const SongProvider = ({ children }) => {
  const [songLists, setSongLists] = useState({ public: [], private: [] });

  // 노래 리스트를 가져오는 함수
  const fetchSongLists = async () => {
    try {
      const token = sessionStorage.getItem('userToken');
      if (!token) {
        console.error('No JWT token found');
        return;
      }

      const publicResponse = await axios.post(
        'http://localhost:5000/api/songs/getList',
        { isPublic: true, offset: 0 }, // body 부분
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const privateResponse = await axios.post(
        'http://localhost:5000/api/songs/getList',
        { isPublic: false, offset: 0 }, // body 부분
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSongLists({
        public: publicResponse.data,
        private: privateResponse.data,
      });
    } catch (error) {
      console.error('Error fetching song lists:', error);
    }
  };

  // 컴포넌트가 마운트되면 노래 리스트를 가져옴
  useEffect(() => {
    fetchSongLists();
  }, []);

  // Context를 통해 songLists와 fetchSongLists를 제공
  return <SongContext.Provider value={{ songLists, fetchSongLists }}>{children}</SongContext.Provider>;
};

// Custom Hook
export const useSongs = () => useContext(SongContext);
