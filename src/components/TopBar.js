import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import '../css/TopBar.css';
import axios from 'axios';

function TopBar() {
  const [error, setError] = useState('');

  const [userData, setUserData] = useState(null);

  const { setIsLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserData = JSON.parse(sessionStorage.getItem('userData'));
    setUserData(storedUserData);
  }, []);

  const Logout = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = sessionStorage.getItem('userToken');
      const response = await axios.delete('http://localhost:5000/api/users/logout', {
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
      <div className='right-section'>
        <button className='logout-button' onClick={Logout}>
          로그아웃
        </button>
        <div className='user-avatar'>A</div>
        <div className='user-details'>
          <h3>User Name</h3>
          <p>Level</p>
        </div>
        <button className='settings-button' onClick={GoSetting}>
          ⚙️
        </button>
      </div>
      {error && <p className='error-message'>{error}</p>}
    </div>
  );
}

export default TopBar;
