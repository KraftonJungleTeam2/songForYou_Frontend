// Context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({}); // 초기 값을 빈 객체로 설정

  useEffect(() => {
    if (!userData.name) { // userData에 name이 없을 때만 데이터 가져오기
      fetchUserData();
    }
  }, [userData]);

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem("userToken");
      if (!token) return;

      const response = await axios.get(
        `${process.env.REACT_APP_API_ENDPOINT}/users/info`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUserData(response.data);
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
