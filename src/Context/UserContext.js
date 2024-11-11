// Context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);


const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};


export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    email: null,
    name: null,
    imgurl: null,
  }); // 초기 값을 빈 객체로 설정

  useEffect(() => {
    console.log(userData);
    if (!userData.name) { // userData에 name이 없을 때만 데이터 가져오기
      fetchUserData();
    }
  }, [userData]);

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem("userToken");
      if (!token) return;

      const response = await fetch(
        `${process.env.REACT_APP_API_ENDPOINT}/users/info`,
        {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`, // 토큰을 Authorization 헤더에 추가
          },
        }
      );

      const formData = await response.formData();
    
      const result = Object.fromEntries(formData.entries());

      console.log(result.image);
      
      const info = JSON.parse(result.info);
      const email = info.email;
      const name = info.name;
      const imgurl = null;
      
      if (result.image && typeof result.image === 'object') {
        imgurl = URL.createObjectURL(result.image);
      }

      setUserData({
        email,
        name,
        imgurl,
      });
      
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};
