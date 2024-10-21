import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Single from './pages/Single';
import Multi from './pages/Multi';
import Setting from './pages/Setting';
import Register from './pages/Register';
import Play from './pages/Play'; // 곡 페이지 컴포넌트
import { AuthProvider, useAuth } from './AuthContext';

function ProtectedRoute({ element }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? element : <Navigate to='/login' replace />;
}

function CheckLoggedIn({ element }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Navigate to='/single' replace /> : element;
}

const isLoggedIn = true;

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className='App'>
          <Routes>
            <Route path='/login' element={<CheckLoggedIn element={<Login />} />} />
            <Route path='/register' element={<CheckLoggedIn element={<Register />} />} />
            <Route path='/single' element={<CheckLoggedIn element={<Single />} />} />
            <Route path='/multi' element={<ProtectedRoute element={<Multi />} />} />
            <Route path='/setting' element={<ProtectedRoute element={<Setting />} />} />
            <Route
            path="/play/:id"
            element={isLoggedIn ? <Play /> : <Navigate to="/login" replace />}
          />
            <Route path='/' element={<Navigate to='/login' replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
