import React, { useState } from "react";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_ENDPOINT}/users/login`,
        { email, password }
      );

      if (response.status === 200) {
        const jwtToken = response.headers["authorization"]?.split(" ")[1];
        if (jwtToken) {
          sessionStorage.setItem("userToken", jwtToken);
        }
        setError("");
        setIsLoggedIn(true);
        navigate("/single");
      } else {
        setError("로그인에 실패하였습니다.");
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError("비밀번호가 유효하지 않습니다.");
        } else if (err.response.status === 404) {
          setError("이메일이 유효하지 않습니다.");
        } else {
          setError("로그인에 실패하였습니다.");
        }
      } else if (err.request) {
        setError("서버로부터 응답을 받지 못했습니다.");
      } else {
        setError("요청 설정 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="background-container">
      <div className="login-container">
        <h1 className="title">Login</h1>
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-container">
            <i className="fa-solid fa-at input-icon"></i>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-container">
            <i className="fa-solid fa-lock input-icon"></i>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="button-con">
            <button className="toregister" onClick={() => navigate("/register")}>회원가입</button>
            <button type="submit" className="login-button">로그인</button>
          </div>
          <div className="error-message">
            {error && <p>{error}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
