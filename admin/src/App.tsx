import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import { authApi } from './api/services';

function App() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthed(false);
      return;
    }
    authApi.verify().then(() => {
      setIsAuthed(true);
    }).catch(() => {
      setIsAuthed(false);
    });
  }, []);

  if (isAuthed === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthed ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/*" element={isAuthed ? <Dashboard /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
