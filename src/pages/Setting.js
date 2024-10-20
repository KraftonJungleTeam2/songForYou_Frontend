import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/Setting.css';

function Setting() {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    // 세션에서 userData를 가져오는 로직 -> 임시로 일단 한거임.
    const sessionUserData = JSON.parse(sessionStorage.getItem('userData'));
    setUserData(sessionUserData);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // PUT 요청으로 사용자 정보 업데이트
      await axios.put('/api/user/update', userData);
      alert('User information updated successfully');
    } catch (error) {
      console.error('Error updating user information:', error);
      alert('Failed to update user information');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const token = 'your_jwt_token'; // 실제 JWT 토큰으로 교체하십시오

        const response = await axios.delete('/api/user/delete', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200 && response.data.success) {
          alert('Account deleted successfully');
          // 로그아웃 처리 및 홈페이지로 리다이렉트
          // sessionStorage.removeItem('userData');
          navigate('/');
        } else {
          alert('Failed to delete account');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account');
      }
    }
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={userData.username}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={userData.password}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="update-button">Update Information</button>
      </form>
      <button onClick={handleDeleteAccount} className="delete-button">Delete Account</button>
    </div>
  );
}

export default Setting;