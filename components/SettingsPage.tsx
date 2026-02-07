import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Save, MessageSquare, Key, Hash, FileText, User, Building } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const SettingsPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [hospital, setHospital] = useState<any>(null);

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
            const [userRes, hospitalRes] = await Promise.all([
                api.getMe(),
                api.getMyHospital()
            ]);

            setProfile(userRes);
            setHospital(hospitalRes);

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

        try {
            await api.updateHospitalSettings({
                wizechat_config: formData
            });
            toast.success("Settings saved successfully!");
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500">Manage your profile and integrations.</p>
            </div>

            {/* Read-Only Profile Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center gap-2 bg-slate-50">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900">Profile & Organization</h2>
                        <p className="text-xs text-slate-500">Synced from WizeFlow (Read-only)</p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium">
                            {profile?.name || 'Loading...'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium">
                            {profile?.email || 'Loading...'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium">
                            {profile?.role || 'Loading...'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Hospital / Clinic</label>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium flex items-center gap-2">
                            <Building className="w-4 h-4 text-slate-400" />
                            {hospital?.name || 'Loading...'}
                        </div>
                    </div>
                </div>
            </div>

            {/* WizeChat Integration Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center gap-2 bg-slate-50">
                    <div className="bg-green-100 p-2 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900">WizeChat Integration</h2>
                        <p className="text-xs text-slate-500">Configure WhatsApp sending via WizeChat API</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Key className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    name="api_key"
                                    value={formData.api_key}
                                    onChange={handleChange}
                                    className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                                    placeholder="wize_sk_..."
                                />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">Your WizeChat Secret Key</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Inbox ID</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Hash className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    name="inbox_id"
                                    value={formData.inbox_id}
                                    onChange={handleChange}
                                    className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                                    placeholder="UUID"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Template ID</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FileText className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    name="template_id"
                                    value={formData.template_id}
                                    onChange={handleChange}
                                    className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                                    placeholder="UUID"
                                />
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Template Name (Optional)</label>
                            <input
                                type="text"
                                name="template_name"
                                value={formData.template_name}
                                onChange={handleChange}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border px-3"
                                placeholder="e.g. consent_form_patient_name"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
