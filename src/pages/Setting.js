import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/Setting.css";
import { useAuth } from "../Context/AuthContext";
import PageTemplate from "../template/PageTemplate";
import { useScreen } from "../Context/ScreenContext";
import { useUser } from "../Context/UserContext";

function Setting() {
  const { isMobile } = useScreen();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const { userData, setUserData } = useUser(); // UserContext에서 userData와 setUserData 가져오기
  const [localData, setLocalData] = useState({
    name: userData.name,
    email: userData.email,
  }); // 로컬 상태 추가
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem("userToken");
      if (!token) {
        console.error("No JWT token found");
        return;
      }
      await axios.put(`${process.env.REACT_APP_API_ENDPOINT}/users/update`, localData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setUserData((prevState) => ({ ...prevState, ...localData })); // 프로필 변경 시 userData에 localData 적용
      alert("프로필 정보가 성공적으로 업데이트되었습니다.");
    } catch (error) {
      console.error("Error updating user information:", error);
      alert("프로필 정보 업데이트에 실패했습니다.");
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("profilePicture", file);
      const token = sessionStorage.getItem("userToken");

      try {
        const response = await axios.put(
          `${process.env.REACT_APP_API_ENDPOINT}/users/updateProfilePicture`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.status === 200) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataURL = reader.result;
            setUserData((prevState) => ({
              ...prevState,
              imgurl: dataURL, // imgurl 필드 업데이트
            }));
            alert("프로필 사진이 성공적으로 업데이트되었습니다.");
          };
          reader.onerror = () => {
            console.error("파일을 data URL로 변환하는 중 오류가 발생했습니다.");
            alert("이미지 처리 중 오류가 발생했습니다.");
          };
          reader.readAsDataURL(file);
        } else {
          alert("프로필 사진 업데이트에 실패했습니다.");
        }
      } catch (error) {
        console.error("프로필 사진 업데이트 중 오류 발생:", error);
        alert("프로필 사진 업데이트에 실패했습니다.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem("userToken");
      await axios.delete(`${process.env.REACT_APP_API_ENDPOINT}/users/logout`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      sessionStorage.removeItem("userToken");
    } catch (err) {
      console.error("Logout error", err);
      alert("로그아웃에 실패했습니다. 다시 시도해주세요.");
    }
    setIsLoggedIn(false);
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      try {
        const token = sessionStorage.getItem("userToken");
        const response = await axios.delete(`${process.env.REACT_APP_API_ENDPOINT}/users/delete`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 200 && response.data.success) {
          alert("계정이 성공적으로 삭제되었습니다.");
          sessionStorage.removeItem("userToken");
          setIsLoggedIn(false);
          navigate("/");
        } else {
          alert("계정 삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("계정 삭제에 실패했습니다.");
      }
    }
  };

  return (
    <PageTemplate
      isMobile={isMobile}
      isSidebarOpen={isSidebarOpen}
      toggleSidebar={toggleSidebar}
      current={"setting"}
    >
      <div className="setting-content-area">
        <div className="settings-container component-container">
          <h1 style={{ textAlign: "center" }}>프로필 설정</h1>

          {/* 프로필 사진과 사용자 정보 수정 폼 */}
          <div className="profile-settings">
            {/* 프로필 사진 섹션 */}
            <div className="profile-picture-section">
                {userData?.imgurl ? (
                <img
                  src={userData.imgurl}
                  alt={`${userData.name}'s avatar`}
                  className="profile-picture"
                />
              ) : (
                <i className="fa-solid fa-user profile-picture"></i>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="profile-picture-input"
              />
              <div className="profile-picture-overlay">
                <span>이미지 업로드</span>
              </div>
            </div>

            {/* 사용자 정보 수정 폼 */}
            <form onSubmit={handleSubmit} className="profile-edit-form">
              <div className="form-group">
                <label htmlFor="name">이름:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={localData.name || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">이메일:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={localData.email || ""}
                  onChange={handleChange}
                />
              </div>
              <button type="submit" className="update-button">프로필 변경</button>
            </form>
          </div>

          {/* 로그아웃 및 계정 삭제 버튼 */}
          <div className="button-group">
            <button className="logout-button" onClick={handleLogout}>로그아웃</button>
            <button onClick={handleDeleteAccount} className="delete-button">계정 삭제</button>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}

export default Setting;
