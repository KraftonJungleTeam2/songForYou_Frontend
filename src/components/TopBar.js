import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../Context/UserContext";
import "../css/TopBar.css";


function TopBar() {
  const { userData } = useUser();
  const navigate = useNavigate();

  const GoSetting = () => {
    navigate("/setting");
  };

  return (
    <div className="top-bar">
      <div className="right-section">
        <div className="user-avatar">A</div>
        <div className="user-details">
          <h3>{userData?.name}</h3>
          <p>{userData?.email}</p>
        </div>
        <button className="settings-button" onClick={GoSetting}>
          <i className="fa-solid fa-gear"></i>
        </button>
      </div>
    </div>
  );
}

export default TopBar;
