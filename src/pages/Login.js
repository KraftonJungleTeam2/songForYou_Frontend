import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Login.css';  // CSS 파일 import

function Login() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // 여기에 로그인 로직을 구현합니다.
    // 예를 들어, API 호출을 통한 인증 등
    console.log('Login attempt:', id, password);
    // 로그인 성공 시 Single 페이지로 이동
    navigate('/single');
  };

  return (
    <div className="background-container">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
        <button onClick={() => navigate('/register')}>Register</button>
      </div>
    </div>
  );
}

export default Login;