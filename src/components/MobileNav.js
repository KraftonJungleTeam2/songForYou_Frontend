// src/components/MobileNav.js
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/MobileNav.css";

function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  // 현재 경로가 특정 경로와 일치하는지 확인하는 함수
  const isActive = (path) => currentPath.includes(path);
  return (
    <div className="mobilenav">
      <button
        className={`nav-button-mobile ${
          isActive("/single") || isActive("/play") ? "active" : ""
        }`}
        onClick={() => navigate("/single")}
      >
        <i className="fa-solid fa-user"></i>
        <p className="nav-caption">혼자서</p>
      </button>
      <button
        className={`nav-button-mobile ${isActive("/add") ? "active" : ""}`}
        onClick={() => navigate("/add")}
      >
        <i
          className="fa-solid fa-circle-plus"
        ></i>
        <p className="nav-caption">노래 추가</p>
      </button>
      <button className={`nav-button-mobile ${
            isActive("/multi") || isActive("/multiplay") ? "active" : ""
          }`} onClick={() => navigate("/multi")}>
        <i
          className={`fa-solid fa-users `}
        ></i>
        <p className="nav-caption">다같이</p>
      </button>
    </div>
  );
}

export default MobileNav;
