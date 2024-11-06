// DarkModeToggle.js
import React, { useEffect, useState } from 'react';

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
    fontSize: '1rem',
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
      {theme === 'dark' ? <i class="fa-solid fa-sun"></i> : <i class="fa-solid fa-moon"></i>}
    </button>
  );
};

export default DarkModeToggle;
