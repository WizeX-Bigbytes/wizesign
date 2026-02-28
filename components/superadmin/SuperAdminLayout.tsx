import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Zap, LogOut, LayoutDashboard, Building2, Users } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const SuperAdminSidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { resetSession, theme, toggleTheme } = useAppStore();

    const isDark = theme === 'dark';

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        resetSession();
        navigate('/');
    };

    const navItems = [
        { path: '/superadmin/dashboard', icon: LayoutDashboard, label: 'Platform Stats' },
        { path: '/superadmin/hospitals', icon: Building2, label: 'Tenant Hospitals' },
        { path: '/superadmin/users', icon: Users, label: 'Platform Users' },
    ];

    return (
        <aside className={`w-72 flex flex-col h-full shrink-0 z-20 transition-colors duration-300 ${isDark ? 'bg-slate-950 border-r border-slate-800' : 'bg-white border-r border-slate-100'
            }`}>
            {/* Branding - Top Left */}
            <div className="h-20 flex items-center px-8 cursor-pointer shrink-0" onClick={() => navigate('/superadmin')}>
                <div className="bg-blue-600 p-1.5 rounded-lg mr-3 shadow-lg shadow-blue-500/30">
                    <Zap className="w-5 h-5 text-white fill-current" />
                </div>
                <div className="flex flex-col">
                    <span className={`font-bold text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>SignWize</span>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-none mt-0.5">Super Admin</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all group relative overflow-hidden ${isActive
                                    ? (isDark ? 'bg-blue-600/10 text-blue-400' : 'bg-blue-50 text-blue-600 shadow-sm')
                                    : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/80')
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-600 rounded-r-full" />
                            )}
                            <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                                }`} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100/10 space-y-4">
                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all border ${isDark
                            ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    {isDark ? (
                        <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-blue-400" />
                            Light Mode
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-slate-400" />
                            Dark Mode
                        </div>
                    )}
                </button>

                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isDark
                            ? 'text-red-400 hover:bg-red-400/10'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                >
                    <LogOut className="w-5 h-5" />
                    Secure Logout
                </button>
            </div>
        </aside>
    );
};

export const SuperAdminLayout: React.FC = () => {
    const { theme } = useAppStore();
    const isDark = theme === 'dark';

    return (
        <div className={`h-screen font-sans flex overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
            }`}>
            <SuperAdminSidebar />
            <main className="flex-1 overflow-auto p-6 md:p-8">
                <div className="max-w-7xl mx-auto h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
