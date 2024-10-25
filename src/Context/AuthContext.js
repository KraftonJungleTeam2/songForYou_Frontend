// Context/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';

// Context 생성
const AuthContext = createContext();

// Provider 생성
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // 초기 상태를 null로 설정하여 초기화 확인
  useEffect(() => {
    const token = sessionStorage.getItem('userToken');
    setIsLoggedIn(!!token); // 토큰이 존재하면 true, 아니면 false
  }, []);

  if (isLoggedIn === null) return null; // 초기화가 완료될 때까지 아무것도 렌더링하지 않음

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = () => useContext(AuthContext);
