import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';

// Pages - HOD
import HODDashboard from './pages/hod/Dashboard';
import TimetableBuilder from './pages/hod/TimetableBuilder';

function ProtectedRoute({ children, allowedRoles }) {
  const { state } = useApp();
  
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(state.currentUser?.role)) {
    return <Navigate to="/" replace />; // Redirect to their own dashboard ideally
  }
  
  return children;
}

function DefaultRedirect() {
  const { state } = useApp();
  if (!state.isAuthenticated) return <Navigate to="/login" replace />;
  if (state.currentUser.role === 'HOD') return <Navigate to="/hod/dashboard" replace />;
  if (state.currentUser.role === 'ASST_HOD') return <Navigate to="/asst-hod/dashboard" replace />;
  return <Navigate to="/faculty/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* HOD Routes */}
      <Route path="/hod" element={
        <ProtectedRoute allowedRoles={['HOD']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<HODDashboard />} />
        <Route path="timetable" element={<TimetableBuilder />} />
        {/* Placeholder for other routes */}
        <Route path="*" element={<div className="p-8 text-white">Under Construction</div>} />
      </Route>

      {/* Fallback */}
      <Route path="/" element={<DefaultRedirect />} />
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
