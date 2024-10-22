import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/users/login', { email, password });

      if (response.status === 200) {
        // JWT를 헤더에서 추출

        const jwtToken = response.headers['authorization']?.split(' ')[1]; // 'Bearer '를 제거하고 토큰만 가져옴

        // 사용자 정보는 response.data에 있습니다
        const userData = response.data;

        // JWT를 세션 스토리지에 저장
        if (jwtToken) {
          sessionStorage.setItem('userToken', jwtToken);
        }

        setError('');
        setIsLoggedIn(true);
        navigate('/single');
      } else {
        setError('로그인에 실패하였습니다.');
      }
    } catch (err) {
      if (err.response) {
        // 서버가 2xx 범위를 벗어나는 상태 코드로 응답한 경우
        if (err.response.status === 401) {
          setError('비밀번호가 유효하지 않습니다.');
        } else if (err.response.status === 404) {
          setError('이메일이 유효하지 않습니다.');
        } else {
          setError('로그인에 실패하였습니다.');
        }
      } else if (err.request) {
        // 요청이 이루어졌으나 응답을 받지 못한 경우
        setError('서버로부터 응답을 받지 못했습니다.');
      } else {
        // 요청을 설정하는 중에 문제가 발생한 경우
        setError('요청 설정 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className='background-container'>
      <div className='login-container'>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input type='email' placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type='submit'>Login</button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button onClick={() => navigate('/register')}>Register</button>
      </div>
    </div>
  );
}

export default Login;
