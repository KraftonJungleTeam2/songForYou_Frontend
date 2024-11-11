// Context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { Parse, getBoundary } from 'parse-multipart'; // 올바른 임포트

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({}); // 초기 값을 빈 객체로 설정
  const [loading, setLoading] = useState(true); // 로딩 상태 추가
  const [error, setError] = useState(null); // 에러 상태 추가

  useEffect(() => {
    if (!userData.name && loading) { // userData에 name이 없고 로딩 중일 때만 데이터 가져오기
      fetchUserData();
    }
  }, [userData, loading]);

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem("userToken");
      if (!token) {
        setError("No token found");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_ENDPOINT}/users/info`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          // responseType: 'arraybuffer', // ArrayBuffer로 응답 받기
        }
      );

      console.log(response);

      const contentType = response.headers['content-type'];
      const boundaryMatch = contentType.match(/boundary=(.*)$/);
      if (!boundaryMatch) {
        throw new Error("No boundary found in content-type");
      }
      const boundary = boundaryMatch[1];

      // ArrayBuffer를 Uint8Array로 변환
      const uint8Array = new Uint8Array(response.data);
      const parts = Parse(uint8Array, boundary); // multipart 데이터 파싱

      let info = {};
      let imageBlob = null;

      parts.forEach(part => {
        const disposition = part.headers['content-disposition'];
        const nameMatch = disposition.match(/name="([^"]+)"/);
        if (nameMatch) {
          const name = nameMatch[1];
          if (name === 'info') {
            info = JSON.parse(new TextDecoder().decode(part.data));
          } else if (name === 'image') {
            imageBlob = new Blob([part.data], { type: 'image/png' });
          }
        }
      });

      const imgurl = imageBlob ? URL.createObjectURL(imageBlob) : null;

      setUserData({
        name: info.name,
        email: info.email,
        imgurl,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ userData, loading, error }}>
      {children}
    </UserContext.Provider>
  );
};
