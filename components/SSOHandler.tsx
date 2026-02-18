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
            let token = searchParams.get('token');
            if (!token) {
                setError("No SSO token provided");
                return;
            }

            // Dev shortcut: convert placeholder token into a real signed token
            if (token === 'test-doctor-token' || token === 'test') {
                const testTokenResponse = await api.generateTestToken();
                token = testTokenResponse.token;
            }

            try {
                // Validate with backend
                const response = await api.validateSSO(token);

                // Store session with correct key
                localStorage.setItem('access_token', response.access_token);

                // Check for patient context in both response.context and decoded JWT
                let contextPatientId = response.context?.patient_id;
                if (!contextPatientId) {
                    const decodedToken = parseJwt(response.access_token);
                    contextPatientId = decodedToken?.patient_id;
                }

                console.log('SSO validated. Patient context:', contextPatientId);

                toast.success("Authenticated via WizeFlow");

                if (contextPatientId) {
                    // Deep Link Mode - redirect to dashboard with patient context
                    console.log('Deep linking to patient:', contextPatientId);
                    
                    // Build URL with all patient details
                    const params = new URLSearchParams({
                        action: 'send',
                        patient_id: contextPatientId,
                        patient_name: response.context?.patient_name || '',
                        patient_email: response.context?.patient_email || '',
                        patient_phone: response.context?.patient_phone || '',
                        patient_dob: response.context?.patient_dob || ''
                    });
                    
                    navigate(`/doctor/dashboard?${params.toString()}`, { replace: true });
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
