import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Save, MessageSquare, Key, Hash, FileText, User, Building, ArrowLeft, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [checkingConnection, setCheckingConnection] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [hospital, setHospital] = useState<any>(null);
    const [wizechatStatus, setWizechatStatus] = useState<any>(null);
    const [connectionCheck, setConnectionCheck] = useState<any>(null);

    const [formData, setFormData] = useState({
        api_key: '',
        inbox_id: '',
        template_id: '',
        template_name: ''
    });

    const { } = useAppStore();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [userRes, hospitalRes, statusRes] = await Promise.all([
                api.getMe(),
                api.getMyHospital(),
                api.getWizeChatStatus()
            ]);

            setProfile(userRes);
            setHospital(hospitalRes);
            setWizechatStatus(statusRes);

            if (hospitalRes && hospitalRes.wizechat_config) {
                setFormData({
                    api_key: hospitalRes.wizechat_config.api_key || '',
                    inbox_id: hospitalRes.wizechat_config.inbox_id || '',
                    template_id: hospitalRes.wizechat_config.template_id || '',
                    template_name: hospitalRes.wizechat_config.template_name || ''
                });
            }
        } catch (error) {
            console.error("Failed to load settings", error);
            toast.error("Failed to load settings");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setConnectionCheck(null);

        try {
            await api.updateHospitalSettings({
                wizechat_config: formData
            });
            toast.success("Settings saved! Checking connection...");

            // Refresh basic status
            const statusRes = await api.getWizeChatStatus();
            setWizechatStatus(statusRes);

            // Run real connection check against WizeChat
            setCheckingConnection(true);
            try {
                const checkRes = await api.checkWizeChatConnection();
                setConnectionCheck(checkRes);
                if (checkRes.connected) {
                    toast.success(`Connected to "${checkRes.inbox_name || 'WizeChat'}" ✅`);
                } else {
                    toast.error(checkRes.message || checkRes.error || 'WizeChat connection failed');
                }
            } catch {
                setConnectionCheck({ connected: false, message: 'Could not reach WizeChat' });
            } finally {
                setCheckingConnection(false);
            }
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    const isDark = useAppStore(state => state.theme === 'dark');

    return (
        <div className={`h-full flex flex-col transition-colors duration-300 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <div className="w-full py-4 px-2 space-y-8 pb-12">
                <div className="flex items-center gap-6 mb-4">
                    <button
                        onClick={() => navigate('/doctor/dashboard')}
                        className={`group p-2 rounded-xl transition-all ${isDark ? 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-white text-slate-500 hover:text-slate-900 hover:shadow-md'
                            } border ${isDark ? 'border-slate-800' : 'border-slate-100'}`}
                    >
                        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    </button>
                    <div>
                        <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Settings</h1>
                        <p className="text-slate-500 font-medium mt-1">Manage your account and WizeChat configuration</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Read-Only Profile Section */}
                    <div className={`lg:col-span-5 rounded-[2.5rem] border overflow-hidden transition-all duration-300 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]'
                        }`}>
                        <div className={`px-8 py-6 flex items-center gap-4 ${isDark ? 'bg-slate-900/40 border-b border-slate-800' : 'bg-slate-50/50 border-b border-slate-50'}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform hover:rotate-3 ${isDark ? 'bg-blue-600/10 text-blue-400' : 'bg-blue-100/50 text-blue-600'}`}>
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg">Profile Details</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Locked to WizeFlow</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            {[
                                { label: 'Full Name', value: profile?.name, icon: User },
                                { label: 'Email Address', value: profile?.email, icon: Building }, // Using Building just for variety as example, User is fine too
                                { label: 'Role', value: profile?.role, icon: Hash },
                                { label: 'Hospital', value: hospital?.name, icon: Building },
                            ].map((item, i) => (
                                <div key={i} className="group">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">{item.label}</label>
                                    <div className={`p-3.5 rounded-2xl border flex items-center gap-3 font-bold text-sm transition-all ${isDark ? 'bg-slate-950/20 border-slate-800 text-slate-300' : 'bg-slate-50/30 border-slate-100 text-slate-700'
                                        }`}>
                                        <item.icon className={`w-4 h-4 opacity-40`} />
                                        {item.value || 'Loading...'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* WizeChat Integration Section */}
                    <div className={`lg:col-span-7 rounded-[2.5rem] border overflow-hidden transition-all duration-300 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]'
                        }`}>
                        <div className={`px-8 py-6 flex items-center justify-between ${isDark ? 'bg-slate-900/40 border-b border-slate-800' : 'bg-slate-50/50 border-b border-slate-50'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform hover:rotate-3 ${isDark ? 'bg-emerald-600/10 text-emerald-400' : 'bg-emerald-100/50 text-emerald-600'}`}>
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">WizeChat Config</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp Integration</p>
                                </div>
                            </div>

                            {checkingConnection ? (
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                    <Loader className="w-3 h-3 animate-spin" />
                                    Checking...
                                </div>
                            ) : connectionCheck ? (
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border transition-all ${connectionCheck.connected
                                    ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-100')
                                    : (isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-100')
                                    }`}>
                                    {connectionCheck.connected
                                        ? <CheckCircle className="w-3 h-3" />
                                        : <XCircle className="w-3 h-3" />}
                                    {connectionCheck.connected ? 'Connected' : 'Not Connected'}
                                </div>
                            ) : wizechatStatus ? (
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border transition-all ${wizechatStatus.configured
                                    ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-100')
                                    : (isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-100')
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${wizechatStatus.configured ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></span>
                                    {wizechatStatus.configured ? 'Configured' : 'Not Configured'}
                                </div>
                            ) : null}
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">WizeChat API Key</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Key className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            name="api_key"
                                            value={formData.api_key}
                                            onChange={handleChange}
                                            className={`pl-11 block w-full rounded-2xl border py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 ${isDark
                                                ? 'bg-slate-950/40 border-slate-800 text-white focus:border-blue-500/50 focus:ring-blue-500/10 placeholder:text-slate-700'
                                                : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/5'
                                                }`}
                                            placeholder="wize_sk_..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Inbox ID</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Hash className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            name="inbox_id"
                                            value={formData.inbox_id}
                                            onChange={handleChange}
                                            className={`pl-11 block w-full rounded-2xl border py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 ${isDark
                                                ? 'bg-slate-950/40 border-slate-800 text-white focus:border-blue-500/50 focus:ring-blue-500/10 placeholder:text-slate-700'
                                                : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/5'
                                                }`}
                                            placeholder="UUID"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Template ID</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FileText className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            name="template_id"
                                            value={formData.template_id}
                                            onChange={handleChange}
                                            className={`pl-11 block w-full rounded-2xl border py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 ${isDark
                                                ? 'bg-slate-950/40 border-slate-800 text-white focus:border-blue-500/50 focus:ring-blue-500/10 placeholder:text-slate-700'
                                                : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/5'
                                                }`}
                                            placeholder="UUID"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Template Name</label>
                                    <input
                                        type="text"
                                        name="template_name"
                                        value={formData.template_name}
                                        onChange={handleChange}
                                        className={`block w-full rounded-2xl border px-4 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 ${isDark
                                            ? 'bg-slate-950/40 border-slate-800 text-white focus:border-blue-500/50 focus:ring-blue-500/10 placeholder:text-slate-700'
                                            : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/5'
                                            }`}
                                        placeholder="e.g. medical_consent_whatsapp"
                                    />
                                </div>
                            </div>

                            {connectionCheck && !connectionCheck.connected && connectionCheck.message && (
                                <p className={`text-xs font-medium px-1 -mt-4 ${isDark ? 'text-rose-400' : 'text-rose-600'
                                    }`}>
                                    ⚠️ {connectionCheck.message}
                                </p>
                            )}
                            {connectionCheck && connectionCheck.connected && connectionCheck.inbox_name && (
                                <p className={`text-xs font-medium px-1 -mt-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'
                                    }`}>
                                    ✅ Inbox: {connectionCheck.inbox_name}{connectionCheck.phone_number ? ` · ${connectionCheck.phone_number}` : ''}
                                </p>
                            )}
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || checkingConnection}
                                    className={`inline-flex items-center gap-3 px-8 py-3.5 rounded-[1.5rem] text-sm font-bold transition-all shadow-xl active:scale-95 disabled:opacity-50 ${isDark ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40' : 'bg-slate-950 hover:bg-slate-900 text-white shadow-black/20'
                                        }`}
                                >
                                    <Save className="w-5 h-5" />
                                    {loading ? 'Saving...' : checkingConnection ? 'Checking...' : 'Save Config'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
