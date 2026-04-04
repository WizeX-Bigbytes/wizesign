import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { User, Mail, Lock, Shield, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const SuperAdminSettings: React.FC = () => {
    const { currentUser, setCurrentUser } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        current_password: '',
        new_password: '',
    });

    useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                name: currentUser.name || '',
                email: currentUser.email || '',
            }));
        } else {
            // Fetch if not in store for some reason
            const fetchProfile = async () => {
                try {
                    setIsLoading(true);
                    // We can just use getMe from auth which works for superadmin too
                    const data = await api.getMe();
                    setCurrentUser(data);
                    setFormData(prev => ({
                        ...prev,
                        name: data.name || '',
                        email: data.email || '',
                    }));
                } catch (error) {
                    toast.error('Failed to load profile details');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProfile();
        }
    }, [currentUser, setCurrentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (formData.new_password && !formData.current_password) {
            toast.error('You must provide your current password to set a new one.');
            return;
        }

        try {
            setIsSaving(true);
            const updatePayload: any = {};
            
            if (formData.name !== currentUser?.name) updatePayload.name = formData.name;
            if (formData.email !== currentUser?.email) updatePayload.email = formData.email;
            
            if (formData.new_password && formData.current_password) {
                updatePayload.current_password = formData.current_password;
                updatePayload.new_password = formData.new_password;
            }

            if (Object.keys(updatePayload).length === 0) {
                toast('No changes to save.', { icon: 'ℹ️' });
                return;
            }

            const updatedUser = await api.updateSuperAdminProfile(updatePayload);
            setCurrentUser(updatedUser);
            
            // Clear password fields on success
            setFormData(prev => ({ ...prev, current_password: '', new_password: '' }));
            toast.success('Profile updated successfully!');

        } catch (error: any) {
            console.error('Update failed:', error);
            toast.error(error.message || 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">Super Admin Settings</h1>
                <p className="text-slate-500 font-medium mt-1">Manage your platform administration account.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Profile Info Section */}
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-600" />
                                Account Details
                            </h2>
                            
                            <div className="grid gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
                                            placeholder="admin@example.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Password Section */}
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-slate-600" />
                                Change Password
                            </h2>
                            <p className="text-sm text-slate-500 mb-4">Leave these blank if you don't want to change your password.</p>
                            
                            <div className="grid gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        name="current_password"
                                        autoComplete="current-password"
                                        value={formData.current_password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                        placeholder="Enter current password to verify"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        name="new_password"
                                        autoComplete="new-password"
                                        value={formData.new_password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                        placeholder="Minimum 8 characters"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-slate-800"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Save Settings
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
