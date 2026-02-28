import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { Loader2 } from 'lucide-react';

export const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('access_token');
    const location = useLocation();

    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const verifyAccess = async () => {
            if (!token) {
                setIsAuthorized(false);
                setIsLoading(false);
                return;
            }

            try {
                const user = await api.getMe();
                if (user.role === 'SUPERADMIN') {
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.error("Super Admin verification failed:", error);
                setIsAuthorized(false);
            } finally {
                setIsLoading(false);
            }
        };

        verifyAccess();
    }, [token]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Verifying authorization...</p>
            </div>
        );
    }

    if (!token || !isAuthorized) {
        // Redirect non-admins to the standard doctor dashboard
        return <Navigate to="/doctor/dashboard" replace />;
    }

    return <>{children}</>;
};
