import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { X, Key, Hash, Shield, Save, Loader2, CheckCircle, AlertTriangle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

interface HospitalSettingsModalProps {
    hospital: any;
    onClose: () => void;
    onSaved: () => void;
}

export const HospitalSettingsModal: React.FC<HospitalSettingsModalProps> = ({
    hospital,
    onClose,
    onSaved,
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        account_sid: '',
        auth_token: '',
        verify_service_sid: '',
    });

    useEffect(() => {
        if (hospital?.twilio_config) {
            setFormData({
                account_sid: hospital.twilio_config.account_sid || '',
                auth_token: hospital.twilio_config.auth_token || '',
                verify_service_sid: hospital.twilio_config.verify_service_sid || '',
            });
        }
    }, [hospital]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isConfigured = !!(formData.account_sid && formData.auth_token && formData.verify_service_sid);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.updateHospitalTwilioConfig(hospital.id, formData);
            toast.success('Twilio configuration saved successfully!');
            onSaved();
        } catch (error: any) {
            console.error('Failed to save Twilio config:', error);
            toast.error(error.message || 'Failed to save configuration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex justify-between items-start relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                <Shield className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Hospital Settings</h2>
                                <p className="text-slate-400 text-xs font-medium">{hospital?.name}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="relative z-10 p-2 rounded-xl bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {/* Twilio Config Section */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                    <Phone className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">Twilio OTP Configuration</h3>
                                    <p className="text-xs text-slate-500 font-medium">SMS & WhatsApp verification via Twilio Verify</p>
                                </div>
                            </div>
                            <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                                isConfigured
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                                {isConfigured ? (
                                    <><CheckCircle className="w-3 h-3" /> Configured</>
                                ) : (
                                    <><AlertTriangle className="w-3 h-3" /> Not Configured</>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Account SID */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                                    Account SID
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Key className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        name="account_sid"
                                        value={formData.account_sid}
                                        onChange={handleChange}
                                        className="pl-11 block w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-500/5 text-slate-900 placeholder:text-slate-400"
                                        placeholder="AC..."
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 px-1">Found in Twilio Console → Account Info</p>
                            </div>

                            {/* Auth Token */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                                    Auth Token
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Key className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        name="auth_token"
                                        value={formData.auth_token}
                                        onChange={handleChange}
                                        className="pl-11 block w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-500/5 text-slate-900 placeholder:text-slate-400"
                                        placeholder="Your auth token..."
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 px-1">Found in Twilio Console → Account Info</p>
                            </div>

                            {/* Verify Service SID */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                                    Verify Service SID
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Hash className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="verify_service_sid"
                                        value={formData.verify_service_sid}
                                        onChange={handleChange}
                                        className="pl-11 block w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-500/5 text-slate-900 placeholder:text-slate-400"
                                        placeholder="VA..."
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 px-1">Create in Twilio Console → Verify → Services</p>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                    <strong>How it works:</strong> When Twilio is configured, patients can choose to receive OTP via <strong>SMS</strong> or <strong>WhatsApp</strong> for identity verification before signing documents. Twilio Verify handles code generation, delivery, and expiry automatically.
                                </p>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all mr-3"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center gap-2.5 px-8 py-3 rounded-2xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xl shadow-black/20 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {loading ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Current WizeChat Status (Read-only) */}
                    {hospital?.wizechat_config?.api_key && (
                        <div className="border-t border-slate-100 pt-6 mt-2">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700 text-sm">WizeChat Integration</h4>
                                    <p className="text-[10px] text-slate-400 font-medium">Active — configured via tenant settings</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
