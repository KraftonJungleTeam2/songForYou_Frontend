import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/Setting.css';
import { useAuth } from '../AuthContext';

function Setting() {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAuth();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem('userToken');

      const response = await axios.get('http://localhost:5000/api/users/info', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 응답에서 사용자 데이터를 가져와 상태를 업데이트
      console.log('response.data', response.data);
      setUserData(response.data);
      console.log('userData', userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // 에러 처리 로직 추가
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // PUT 요청으로 사용자 정보 업데이트
      const token = sessionStorage.getItem('userToken');
      if (!token) {
        console.error('No JWT token found');
        return;
      }

      const response = await fetch('http://localhost:5000/api/users/update', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      alert('User information updated successfully');
    } catch (error) {
      console.error('Error updating user information:', error);
      alert('Failed to update user information');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const token = sessionStorage.getItem('userToken');

        const response = await axios.delete('http://localhost:5000/api/users/delete', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200 && response.data.success) {
          alert('Account deleted successfully');
          // 로그아웃 처리 및 홈페이지로 리다이렉트
          sessionStorage.removeItem('userToken');
          setIsLoggedIn(false);
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
    <div className='settings-container'>
      <h2>Settings</h2>
      <form onSubmit={handleSubmit}>
        <div className='form-group'>
          <label htmlFor='name'>Name:</label>
          <input type='text' id='name' name='name' value={userData.name} onChange={handleChange} />
        </div>
        <div className='form-group'>
          <label htmlFor='email'>Email:</label>
          <input type='email' id='email' name='email' value={userData.email} onChange={handleChange} />
        </div>
        <div className='form-group'>
          <label htmlFor='password'>Password:</label>
          <input type='password' id='password' name='password' value={userData.password} onChange={handleChange} />
        </div>
        <button type='submit' className='update-button'>
          Update Information
        </button>
      </form>
      <button onClick={handleDeleteAccount} className='delete-button'>
        Delete Account
      </button>
    </div>
  );
}

export default Setting;
