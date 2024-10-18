import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Single from './pages/Single';
import Multi from './pages/Multi';
import Setting from './pages/Setting';
import Register from './pages/Register';

// 토큰 유효성 확인 함수
const isUserLoggedIn = () => {
  const token = sessionStorage.getItem('userToken');
  // return !!token; // 토큰이 존재하면 true 반환
  return true
};

function App() {
  const isLoggedIn = isUserLoggedIn();

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/single"
            element={isLoggedIn ? <Single /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/multi"
            element={isLoggedIn ? <Multi /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/setting"
            element={isLoggedIn ? <Setting /> : <Navigate to="/login" replace />}
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;