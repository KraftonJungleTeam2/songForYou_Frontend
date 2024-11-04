import React, { createContext, useContext } from 'react';
import { useMediaQuery } from 'react-responsive';

const ScreenContext = createContext();

export const ScreenProvider = ({ children }) => {
  const isMobile = useMediaQuery({ query: '(max-width: 1024px)' });

  return (
    <ScreenContext.Provider value={{ isMobile }}>
      {children}
    </ScreenContext.Provider>
  );
};

export const useScreen = () => useContext(ScreenContext);
