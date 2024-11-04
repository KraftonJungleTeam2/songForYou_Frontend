import React, { createContext, useContext, useEffect, useState } from 'react';

const ScreenContext = createContext();

export const ScreenProvider = ({ children }) => {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileOrTablet(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ScreenContext.Provider value={{ isMobileOrTablet }}>
      {children}
    </ScreenContext.Provider>
  );
};

export const useScreen = () => useContext(ScreenContext);
