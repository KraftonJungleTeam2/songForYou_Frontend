import React, { createContext, useContext, useState, useEffect } from 'react';

// Context 생성
const AuthContext = createContext();

// Provider 생성
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const token = sessionStorage.getItem('userToken');
    setIsLoggedIn(!!token); // 토큰이 존재하면 true, 아니면 false
  }, []);
  return <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>{children}</AuthContext.Provider>;
};

// Custom Hook
export const useAuth = () => useContext(AuthContext);
