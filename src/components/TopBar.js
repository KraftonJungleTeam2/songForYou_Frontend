import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate, useLocation  } from 'react-router-dom';
import '../css/TopBar.css';
import axios from 'axios';
import { useScreen } from '../Context/ScreenContext';
import DarkModeToggle from '../components/DarkButton.js'


function TopBar() {
  const [error, setError] = useState('');
  const { isMobile } = useScreen();

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const { setIsLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem('userToken');

      const response = await axios.get(`${process.env.REACT_APP_API_ENDPOINT}/users/info`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 응답에서 사용자 데이터를 가져와 상태를 업데이트
      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // 에러 처리 로직 추가
    }
  };

  const Logout = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = sessionStorage.getItem('userToken');
      const response = await axios.delete(`${process.env.REACT_APP_API_ENDPOINT}/users/logout`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 세션 스토리지에서 토큰과 사용자 정보 삭제
      sessionStorage.removeItem('userToken');

      setIsLoggedIn(false);
      // 로그아웃 성공 시 로그인 페이지로 이동
      navigate('/login');
    } catch (err) {
      alert('로그아웃에 실패했습니다. 다시 시도해주세요.');
      console.error('Logout error', err);
    }
  };

  const GoSetting = () => {
    navigate('/setting');
  };

  return (
    <div className='top-bar'>

      {isMobile ? <DarkModeToggle /> : '' }
      
      <div className='right-section'>
        <button className='button is-dark logout-button' onClick={Logout}>
          로그아웃
        </button>
        <div className='user-avatar'>A</div>
        <div className='user-details'>
          <h3>{userData.name}</h3>
          <p>{userData.email}</p>
        </div>
        <button className='settings-button' onClick={GoSetting}>
          ⚙️
        </button>
      </div>

    </div>
  );
}

export default TopBar;
