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
        `${process.env.REACT_APP_API_ENDPOINT}/songs/getList`,
        { isPublic: true, offset: 0 }, // body 부분
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const privateResponse = await axios.post(
        `${process.env.REACT_APP_API_ENDPOINT}/songs/getList`,
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

  return <SongContext.Provider value={{ songLists, fetchSongLists }}>{children}</SongContext.Provider>;
};

// Custom Hook
export const useSongs = () => useContext(SongContext);
