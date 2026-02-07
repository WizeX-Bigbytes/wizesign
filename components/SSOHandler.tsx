import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { toast } from 'sonner';

export const SSOHandler: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleSSO = async () => {
            const token = searchParams.get('token');
            if (!token) {
                setError("No SSO token provided");
                return;
            }

            try {
                // Validate with backend
                const response = await api.validateSSO(token);

                // Store session
                localStorage.setItem('access_token', response.access_token);

                // Decode token to check for context
                // const decoded: any = jwtDecode(response.access_token);
                // const patientId = decoded.patient_id; 
                // Alternatively, backend might return context in response body if we structured it that way
                // api.ts defined response as { access_token, context? }

                const contextPatientId = response.context?.patient_id || parseJwt(response.access_token)?.patient_id;

                toast.success("Authenticated via WizeFlow");

                if (contextPatientId) {
                    // Deep Link Mode
                    navigate(`/doctor/dashboard?action=send&patient_id=${contextPatientId}`, { replace: true });
                } else {
                    // Standard Login
                    navigate('/doctor/dashboard', { replace: true });
                }

            } catch (err: any) {
                console.error("SSO Error", err);
                setError(err.message || "SSO Validation Failed");
                toast.error("SSO Failed: " + (err.message || "Unknown error"));
                // navigate('/', { state: { error: err.message } }); // Optional: go back to landing
            }
        };

        handleSSO();
    }, [searchParams, navigate]);

    // Helper if jwt-decode lib isn't handy or minimal
    const parseJwt = (token: string) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-red-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-100">
                    <h2 className="text-red-600 text-xl font-bold mb-2">Authentication Failed</h2>
                    <p className="text-slate-600">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Authenticating with WizeFlow...</p>
            </div>
        </div>
    );
};
