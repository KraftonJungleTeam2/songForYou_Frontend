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
                <Route
                  path="/login"
                  element={<CheckLoggedIn element={<Login />} />}
                />
                <Route
                  path="/register"
                  element={<CheckLoggedIn element={<Register />} />}
                />
                <Route
                  path="/single"
                  element={<ProtectedRoute element={<Single />} />}
                />
                <Route
                  path="/multi"
                  element={<ProtectedRoute element={<Multi />} />}
                />
                <Route
                  path="/setting"
                  element={<ProtectedRoute element={<Setting />} />}
                />
                <Route
                  path="/play/:id"
                  element={<ProtectedRoute element={<Play />} />}
                />
                <Route
                  path="/add"
                  element={<ProtectedRoute element={<Add />} />}
                />
                <Route
                  path="/multiplay/:roomId"
                  element={<ProtectedRoute element={<MultiPlay />} />}
                />
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
