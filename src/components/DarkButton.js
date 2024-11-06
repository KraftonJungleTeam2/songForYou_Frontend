// DarkModeToggle.js
import React, { useEffect, useState } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

const DarkModeToggle = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const buttonStyle = {
    cursor: 'pointer',
    fontSize: '3rem',
    width: '2.8rem', // 버튼 크기를 조금 키움
    height: '2.8rem',
    backgroundColor: theme === 'light' ? '#333' : '#ddd',
    color: theme === 'light' ? '#fff' : '#000',
    border: '1px solid #888',
    borderRadius: '5px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };

  return (
    <button style={buttonStyle} onClick={toggleTheme}>
      {theme === 'dark' ? <FaSun /> : <FaMoon />}
    </button>
  );
};

export default DarkModeToggle;
