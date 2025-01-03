import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/Register.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_ENDPOINT}/users/register`,
        { name, email, password }
      );
      console.log(response.data);
      // 회원가입 성공 시 로그인 페이지로 이동
      navigate("/login");
    } catch (err) {
      setError("회원가입에 실패했습니다. 다시 시도해주세요.");
      console.error("Registration error", err);
    }
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <div className="background-container">
      <div className="register-container">
        <h2>회원가입</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">이메일:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="username">사용자 이름:</label>
            <input
              type="text"
              id="username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">비밀번호:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="button is-highlight">가입하기</button>
        </form>
        <div>
          <span style={{display: 'inline-block', margin: '1rem 0'}}>
            이미 계정이 있으신가요?
          </span>
          <button onClick={handleLoginClick} className="text-button button is-highlight"
          style={{display: 'inline-block', height: '2.5rem', margin: '0.5rem'}}>
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
