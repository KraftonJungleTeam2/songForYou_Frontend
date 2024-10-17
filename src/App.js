import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Single from './pages/Single';
import Multi from './pages/Multi';
import Add from './pages/Add';
import Register from './pages/Register';

// Hi from json-yun
// hihi

function App() {
  // 여기서는 간단한 예시로 로그인 상태를 항상 false로 가정합니다.
  // 실제 애플리케이션에서는 상태 관리 라이브러리나 컨텍스트를 사용하여 관리해야 합니다.
  const isLoggedIn = true;
  // const isLoggedIn = false;

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register/>}/>
          <Route 
            path="/single" 
            element={isLoggedIn ? <Single /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/multi" 
            element={isLoggedIn ? <Multi /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/add" 
            element={isLoggedIn ? <Add /> : <Navigate to="/login" replace />} 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;