import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Single from './pages/Single';
import Multi from './pages/Multi';
import Setting from './pages/Setting';
import Register from './pages/Register';
import Add from './pages/Add';
import Play from './pages/Play'; // 곡 페이지 컴포넌트
import MultiPlay from './pages/MultiPlay';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './Context/AuthContext';
import { SongProvider, useSong } from './Context/SongContext';

function ProtectedRoute({ element }) {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn === null) return null; // 초기화가 완료될 때까지 대기
  return isLoggedIn ? element : <Navigate to='/login' replace />;
}

function CheckLoggedIn({ element }) {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn === null) return null; // 초기화가 완료될 때까지 대기
  return isLoggedIn ? <Navigate to='/single' replace /> : element;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className='App'>
          <SongProvider>
            <ToastContainer />
            <Routes>
              <Route path='/login' element={<CheckLoggedIn element={<Login />} />} />
              <Route path='/register' element={<CheckLoggedIn element={<Register />} />} />
              <Route path='/single' element={<ProtectedRoute element={<Single />} />} />
              <Route path='/multi' element={<ProtectedRoute element={<Multi />} />} />
              <Route path='/setting' element={<ProtectedRoute element={<Setting />} />} />
              <Route path='/play/:id' element={<Play />} />
              <Route path='/add' element={<Add />} />
              <Route path='/multiplay/:roomid' element={<MultiPlay />} />
              <Route path='/' element={<Navigate to='/login' replace />} />
            </Routes>
          </SongProvider>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
