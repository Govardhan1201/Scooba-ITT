import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';

import HODDashboard from './pages/hod/Dashboard';
import TimetableBuilder from './pages/hod/TimetableBuilder';
import HODApprovals from './pages/hod/Approvals';
import WorkloadPage from './pages/hod/Workload';
import OptimizationPage from './pages/hod/Optimization';
import AcademicSetup from './pages/hod/AcademicSetup';
import Settings from './pages/hod/Settings';

// Pages - Faculty
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyProfile from './pages/faculty/Profile';

function ProtectedRoute({ children, allowedRoles }) {
  const { state } = useApp();
  if (!state.isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(state.currentUser?.role)) return <Navigate to="/" replace />;
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
        <Route path="workload" element={<WorkloadPage />} />
        <Route path="optimization" element={<OptimizationPage />} />
        <Route path="academic-setup" element={<AcademicSetup />} />
        <Route path="settings" element={<Settings />} />
        <Route path="approvals" element={<HODApprovals />} />
        <Route path="*" element={<div className="p-8 text-[var(--text-secondary)] text-center"><p className="text-2xl font-heading font-bold text-white mb-2">Coming Soon</p><p>This section is under active development.</p></div>} />
      </Route>

      {/* ASST HOD Routes – uses same Layout/Sidebar */}
      <Route path="/asst-hod" element={
        <ProtectedRoute allowedRoles={['ASST_HOD']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<HODDashboard />} />
        <Route path="timetable" element={<TimetableBuilder />} />
        <Route path="workload" element={<WorkloadPage />} />
        <Route path="optimization" element={<OptimizationPage />} />
        <Route path="academic-setup" element={<AcademicSetup />} />
        <Route path="settings" element={<Settings />} />
        <Route path="approvals" element={<HODApprovals />} />
        <Route path="*" element={<div className="p-8 text-[var(--text-secondary)] text-center"><p className="text-2xl font-heading font-bold text-white mb-2">Coming Soon</p></div>} />
      </Route>

      {/* Faculty Routes */}
      <Route path="/faculty" element={
        <ProtectedRoute allowedRoles={['FACULTY']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<FacultyDashboard />} />
        <Route path="profile" element={<FacultyProfile />} />
        <Route path="*" element={<div className="p-8 text-[var(--text-secondary)] text-center"><p className="text-2xl font-heading font-bold text-white mb-2">Coming Soon</p></div>} />
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
