import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Zap, User, LogOut, Settings } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const DoctorHeader: React.FC = () => {
    const { resetSession } = useAppStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        resetSession();
        navigate('/');
    };

    return (
        <nav className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex justify-between items-center shrink-0 z-50">
            {/* Branding */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/doctor/dashboard')}>
                <div className="bg-blue-600 p-1.5 rounded-lg">
                    <Zap className="w-5 h-5 text-white fill-current" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-lg text-slate-900 leading-tight tracking-tight">wizex</span>
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Doctor Portal</span>
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-6">
                {/* User Profile Snippet */}
                <div className="hidden md:flex items-center gap-3 pl-6 border-l border-slate-100">
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">Dr. Michael Chen</p>
                        <p className="text-xs text-slate-500">Cardiology</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                        <User className="w-5 h-5" />
                    </div>
                </div>

                <button
                    onClick={() => navigate('/doctor/settings')}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors mr-4"
                >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Settings</span>
                </button>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-slate-500 hover:text-red-600 text-sm font-medium transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Back to Hub</span>
                </button>
            </div>
        </nav>
    );
};

export const DoctorLayout: React.FC = () => {
    return (
        <div className="h-screen bg-slate-50 font-sans text-slate-900 flex flex-col overflow-hidden">
            <DoctorHeader />
            <main className="flex-1 overflow-hidden p-4 md:p-6">
                <Outlet />
            </main>
        </div>
    );
};
