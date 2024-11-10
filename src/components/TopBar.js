import React, { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/TopBar.css";
import axios from "axios";
import { useScreen } from "../Context/ScreenContext";
import DarkModeToggle from "../components/DarkButton.js";

function TopBar() {
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Change handler
    const handleChange = (e) => setIsDarkMode(e.matches);

    // Add event listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const { setIsLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem("userToken");

      const response = await axios.get(
        `${process.env.REACT_APP_API_ENDPOINT}/users/info`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 응답에서 사용자 데이터를 가져와 상태를 업데이트
      setUserData(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // 에러 처리 로직 추가
    }
  };


  const GoSetting = () => {
    navigate("/setting");
  };

  return (
    <div className="top-bar">
      <img className="logo" src={`${isDarkMode ? "/logo_dark.png" : "/logo.png"}`}></img>
      <div className="right-section">
        <div className="user-avatar">A</div>
        <div className="user-details">
          <h3>{userData.name}</h3>
          <p>{userData.email}</p>
        </div>
        <button className="settings-button" onClick={GoSetting}>
        <i className="fa-solid fa-gear"></i>
        </button>
      </div>
    </div>
  );
}

export default TopBar;
