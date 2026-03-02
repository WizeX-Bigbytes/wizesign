import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Zap, User, LogOut, Settings, FolderOpen, FileText, Sun, Moon, MoreVertical } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';

const DoctorSidebar: React.FC = () => {
    const {
        resetSession,
        currentUser,
        setCurrentUser,
        currentHospital,
        setCurrentHospital,
        theme,
        toggleTheme
    } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const currentView = searchParams.get('view') || 'templates';
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            api.getMe()
                .then(user => setCurrentUser(user))
                .catch(err => console.error("Failed to load user profile", err));
        }
        if (!currentHospital) {
            api.getMyHospital()
                .then(hospital => setCurrentHospital(hospital))
                .catch(err => console.error("Failed to load hospital profile", err));
        }
    }, [currentUser, setCurrentUser, currentHospital, setCurrentHospital]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        resetSession();
        navigate('/');
    };

    const navItems = [
        {
            id: 'templates',
            label: 'Templates',
            icon: FolderOpen,
            path: '/doctor/dashboard?view=templates',
            active: currentView === 'templates' && location.pathname.includes('dashboard')
        },
        {
            id: 'documents',
            label: 'Sent Docs',
            icon: FileText,
            path: '/doctor/dashboard?view=documents',
            active: currentView === 'documents' && location.pathname.includes('dashboard')
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            path: '/doctor/settings',
            active: location.pathname.includes('settings')
        },
    ];

    const isDark = theme === 'dark';

    return (
        <aside className={`fixed bottom-4 left-4 right-4 z-50 rounded-2xl shadow-xl md:shadow-none md:rounded-none md:static md:w-72 flex flex-row md:flex-col h-16 md:h-[100dvh] shrink-0 transition-colors duration-300 ${isDark ? 'bg-slate-900 border md:border-y-0 md:border-l-0 md:border-r border-slate-800' : 'bg-white border md:border-y-0 md:border-l-0 md:border-r border-slate-200'
            }`}>
            {/* Branding - Top Left (Hidden on Mobile) */}
            <div className="hidden md:flex h-20 items-center px-8 cursor-pointer shrink-0" onClick={() => navigate('/doctor/dashboard')}>
                <div className="bg-blue-600 p-1.5 rounded-lg mr-3 shadow-lg shadow-blue-500/30">
                    <Zap className="w-5 h-5 text-white fill-current" />
                </div>
                <span className={`font-bold text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>SignWize</span>
            </div>

            {/* Navigation - Sidebar Items */}
            <nav className="flex-1 flex flex-row md:flex-col px-2 md:px-4 space-x-1 md:space-x-0 md:space-y-1.5 mt-0 md:mt-2 items-center md:items-stretch justify-between md:justify-start">

                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center justify-center md:justify-start gap-1 md:gap-3 py-1.5 md:px-3 md:py-2 rounded-lg font-medium text-[10px] md:text-sm transition-all group relative ${item.active
                            ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
                            : (isDark ? 'text-slate-400 hover:text-slate-200 md:hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 md:hover:bg-slate-100')
                            }`}
                    >
                        <item.icon className={`w-5 h-5 md:w-4 md:h-4 transition-colors ${item.active ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-slate-400 group-hover:text-slate-600'
                            }`} />
                        <span className="hidden md:inline">{item.label}</span>
                    </button>
                ))}

                {/* Mobile action icons added inside nav for bottom bar */}
                <div className="relative md:hidden flex items-center px-1">
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className={`p-2 rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* Mobile Popover Menu */}
                    {showMobileMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                            <div className={`absolute bottom-full right-0 mb-4 w-48 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
                                <div className="p-2 space-y-1 relative z-50">
                                    <button
                                        onClick={() => { toggleTheme(); setShowMobileMenu(false); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-colors ${isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                            }`}
                                    >
                                        {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                                        {isDark ? 'Dark Mode' : 'Light Mode'}
                                    </button>
                                    <button
                                        onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-colors ${isDark ? 'text-slate-300 hover:text-red-400 hover:bg-slate-700' : 'text-slate-600 hover:text-red-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </nav>

            {/* Bottom Section (Desktop Only) */}
            <div className={`hidden md:block p-6 space-y-4 ${isDark ? 'border-t border-slate-900' : 'border-t border-slate-50'}`}>
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-[10px] md:text-sm transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                >
                    {isDark ? <Moon className="w-5 h-5 md:w-4 md:h-4" /> : <Sun className="w-5 h-5 md:w-4 md:h-4" />}
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                </button>

                {/* Profile Card */}
                <div className={`p-4 rounded-3xl flex items-center gap-3 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'
                    }`}>
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm shadow-emerald-500/20">
                        {currentUser?.name?.charAt(0) || 'D'}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className={`font-bold text-sm truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                            {currentUser?.name || 'Doctor'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">
                            {currentUser?.role || 'User'} • {currentUser?.email?.split('@')[0]}
                        </span>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-[10px] md:text-sm transition-colors ${isDark ? 'text-slate-400 hover:text-red-400' : 'text-slate-600 hover:text-red-600 hover:bg-slate-100'
                        }`}
                >
                    <LogOut className="w-5 h-5 md:w-4 md:h-4" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export const DoctorLayout: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useAppStore();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    const isDark = theme === 'dark';

    return (
        <div className={`h-[100dvh] font-sans flex flex-col-reverse md:flex-row overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
            }`}>
            <DoctorSidebar />
            <main className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6 lg:p-10 lg:pb-10">
                <div className="w-full min-h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
