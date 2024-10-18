import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, password: password }),
      });
    
      if (response.ok) {
        // JWT를 헤더에서 추출
        const jwtToken = response.headers.get('Authorization').split(' ')[1]; // 'Bearer '를 제거하고 토큰만 가져옴
        
        // 사용자 정보를 JSON으로 파싱
        const userData = await response.json();
    
        // JWT를 세션 스토리지에 저장
        sessionStorage.setItem('userToken', jwtToken);
        
        // 사용자 정보를 별도로 저장할 수 있음 (선택 사항)
        sessionStorage.setItem('userData', JSON.stringify(userData));
    
        setError('');
        navigate('/single');
      } else if (response.status === 401) {
        setError('비밀번호가 유효하지 않습니다.');
      } else if (response.status === 404) {
        setError('이메일이 유효하지 않습니다.');
      } else {
        setError('로그인에 실패하였습니다.');
      }
    } catch (err) {
      setError('서버와의 통신에 문제가 발생했습니다.');
    }
  };

  return (
    <div className="background-container">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button onClick={() => navigate('/register')}>Register</button>
      </div>
    </div>
  );
}

export default Login;