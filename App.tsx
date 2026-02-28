import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DoctorLayout } from './components/DoctorLayout';
import { DoctorDashboard } from './components/DoctorDashboard';
import { DoctorEditor } from './components/DoctorEditor';
import { PatientView } from './components/PatientView';
import { CompletedView } from './components/CompletedView';
import { LoginPage } from './components/LoginPage';
import { SSOHandler } from './components/SSOHandler';
import { SettingsPage } from './components/SettingsPage';
import { DocumentDetailView } from './components/DocumentDetailView';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { SuperAdminRoute } from './components/superadmin/SuperAdminRoute';
import { SuperAdminLayout } from './components/superadmin/SuperAdminLayout';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { HospitalManager } from './components/superadmin/HospitalManager';
import { UserManager } from './components/superadmin/UserManager';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          {/* Super Admin Routes */}
          <Route path="/superadmin" element={
            <SuperAdminRoute>
              <SuperAdminLayout />
            </SuperAdminRoute>
          }>
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="hospitals" element={<HospitalManager />} />
            <Route path="users" element={<UserManager />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route path="/doctor" element={
            <ProtectedRoute>
              <DoctorLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="editor" element={<DoctorEditor />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="document/:documentId" element={<DocumentDetailView />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route path="/patient/view" element={<PatientView />} />
          <Route path="/completed" element={<CompletedView />} />
          <Route path="/sso" element={<SSOHandler />} />
          <Route path="/sso-handler" element={<SSOHandler />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;