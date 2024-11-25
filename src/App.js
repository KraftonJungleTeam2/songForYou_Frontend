import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Single from "./pages/Single";
import Multi from "./pages/Multi";
import Setting from "./pages/Setting";
import Register from "./pages/Register";
import Add from "./pages/Add";
import Play from "./pages/Play";
import MultiPlay from "./pages/MultiPlay";
import { ToastContainer } from "react-toastify";
import { AuthProvider, useAuth } from "./Context/AuthContext";
import { SongProvider } from "./Context/SongContext";
import { ScreenProvider } from "./Context/ScreenContext";
import { UserProvider } from "./Context/UserContext";

function ProtectedRoute({ element }) {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn === null) return null;
  return isLoggedIn ? element : <Navigate to="/login" replace />;
}

function CheckLoggedIn({ element }) {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn === null) return null;
  return isLoggedIn ? <Navigate to="/single" replace /> : element;
}

function App() {
  return (
    <AuthProvider>
      <ScreenProvider>
        <Router>
          <div className="App">
            <SongProvider>
              <ToastContainer />
              <Routes>
                {/* 로그인과 회원가입 라우트는 UserProvider 미적용 */}
                <Route
                  path="/login"
                  element={<CheckLoggedIn element={<Login />} />}
                />
                <Route
                  path="/register"
                  element={<CheckLoggedIn element={<Register />} />}
                />

                {/* 로그인된 경우에만 접근 가능한 라우트들에 UserProvider 적용 */}
                <Route
                  path="/single"
                  element={
                    <UserProvider>
                      <ProtectedRoute element={<Single />} />
                    </UserProvider>
                  }
                />
                <Route
                  path="/multi"
                  element={
                    <UserProvider>
                      <ProtectedRoute element={<Multi />} />
                    </UserProvider>
                  }
                />
                <Route
                  path="/setting"
                  element={
                    <UserProvider>
                      <ProtectedRoute element={<Setting />} />
                    </UserProvider>
                  }
                />
                <Route
                  path="/play/:id"
                  element={
                    <UserProvider>
                      <ProtectedRoute element={<Play />} />
                    </UserProvider>
                  }
                />
                <Route
                  path="/add"
                  element={
                    <UserProvider>
                      <ProtectedRoute element={<Add />} />
                    </UserProvider>
                  }
                />
                <Route
                  path="/multiplay/:roomId"
                  element={
                    <UserProvider>
                      <ProtectedRoute element={<MultiPlay />} />
                    </UserProvider>
                  }
                />

                {/* 기본 경로는 로그인 페이지로 이동 */}
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </SongProvider>
          </div>
        </Router>
      </ScreenProvider>
    </AuthProvider>
  );
}


export default App;
