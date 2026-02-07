import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DoctorLayout } from './components/DoctorLayout';
import { DoctorDashboard } from './components/DoctorDashboard';
import { DoctorEditor } from './components/DoctorEditor';
import { PatientView } from './components/PatientView';
import { CompletedView } from './components/CompletedView';
import { LandingPage } from './components/LandingPage';
import { SSOHandler } from './components/SSOHandler';
import { SettingsPage } from './components/SettingsPage';

import { Toaster } from 'sonner';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/doctor" element={<DoctorLayout />}>
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="editor" element={<DoctorEditor />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route path="/patient/view" element={<PatientView />} />
          <Route path="/completed" element={<CompletedView />} />
          <Route path="/sso" element={<SSOHandler />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;