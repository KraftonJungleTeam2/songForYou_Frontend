import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';

const ScreenContext = createContext();

export const ScreenProvider = ({ children }) => {
  const isMobile = useMediaQuery({ query: '(max-width: 1024px)' });
  const isPhone = useMediaQuery({ query: '(max-width: 768px)' });
  const [screenSize, setScreenSize] = useState({
    widthScreen: window.innerWidth,
    heightScreen: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        widthScreen: window.innerWidth,
        heightScreen: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ScreenContext.Provider value={{ isPhone, isMobile, ...screenSize }}>
      {children}
    </ScreenContext.Provider>
  );
};

export const useScreen = () => useContext(ScreenContext);
