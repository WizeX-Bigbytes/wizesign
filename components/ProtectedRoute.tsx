import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('access_token');
    const location = useLocation();

    if (!token) {
        // Redirect to login page and save the attempted URL
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
