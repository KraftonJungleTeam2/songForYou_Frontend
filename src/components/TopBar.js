import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../Context/UserContext";
import "../css/TopBar.css";


function TopBar() {
  const { setIsLoggedIn } = useAuth();
  const { userData } = useUser();
  const navigate = useNavigate();

  const GoSetting = () => {
    navigate("/setting");
  };
  
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

 

  return (
    <div className="top-bar">
      <img className="logo" src={`${isDarkMode ? "/logo_dark.png" : "/logo.png"}`}></img>
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
