import React, { useState, useRef } from 'react';
import { Shield, Smartphone, ArrowRight, Loader2, MessageSquare, Phone } from 'lucide-react';

interface OTPVerificationProps {
    step: 'START' | 'OTP' | 'VERIFIED';
    isProcessing: boolean;
    onSendCode: (channel: 'sms' | 'whatsapp' | 'wizechat') => void;
    onVerifyCode: (code: string) => void;
    onResend: () => void;
    patientPhone?: string;
    hasTwilio?: boolean;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
    step,
    isProcessing,
    onSendCode,
    onVerifyCode,
    onResend,
    patientPhone,
    hasTwilio = true,
}) => {
    const [otpCode, setOtpCode] = useState('');
    const [selectedChannel, setSelectedChannel] = useState<'sms' | 'whatsapp' | 'wizechat' | null>(null);
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    if (step === 'VERIFIED') return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length < 6) return;
        onVerifyCode(otpCode);
    };

    const handleSendWithChannel = (channel: 'sms' | 'whatsapp' | 'wizechat') => {
        setSelectedChannel(channel);
        onSendCode(channel);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-blue-600 p-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        {step === 'START' ? (
                            <Shield className="w-8 h-8 text-white" />
                        ) : (
                            <Smartphone className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-white relative z-10">Security Check</h2>
                    <p className="text-blue-100 text-sm mt-1 relative z-10">
                        {step === 'START'
                            ? "We need to verify your identity to view this medical document."
                            : `Verification code sent via ${selectedChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}.`}
                    </p>
                </div>

                <div className="p-6 md:p-8">
                    {step === 'START' ? (
                        <div className="space-y-6">
                            {/* Phone display */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                    <Smartphone className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Mobile Number</p>
                                    <p className="text-slate-900 font-mono font-medium">{patientPhone || '+** (***) *** - ****'}</p>
                                </div>
                            </div>

                            {/* Channel Selection */}
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-3 text-center">
                                    {hasTwilio ? 'Choose Verification Method' : 'Verify via WhatsApp'}
                                </p>
                                <div className={`grid gap-3 ${hasTwilio ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {/* SMS Button — only shown when Twilio is configured */}
                                    {hasTwilio && (
                                        <button
                                            onClick={() => handleSendWithChannel('sms')}
                                            disabled={isProcessing}
                                            className="group relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                                        >
                                            {isProcessing && selectedChannel === 'sms' ? (
                                                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
                                                    <Phone className="w-6 h-6 text-white" />
                                                </div>
                                            )}
                                            <div className="text-center">
                                                <span className="font-bold text-sm text-slate-900 block">SMS</span>
                                                <span className="text-[10px] text-slate-400 font-medium">Text Message</span>
                                            </div>
                                        </button>
                                    )}

                                    {/* WhatsApp Button — always shown */}
                                    <button
                                        onClick={() => handleSendWithChannel(hasTwilio ? 'whatsapp' : 'wizechat')}
                                        disabled={isProcessing}
                                        className={`group relative flex ${hasTwilio ? 'flex-col' : 'flex-row'} items-center gap-2.5 p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none`}
                                    >
                                        {isProcessing && (selectedChannel === 'whatsapp' || selectedChannel === 'wizechat') ? (
                                            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                                                <MessageSquare className="w-6 h-6 text-white" />
                                            </div>
                                        )}
                                        <div className={hasTwilio ? 'text-center' : ''}>
                                            <span className="font-bold text-sm text-slate-900 block">WhatsApp</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Chat Message</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <p className="text-center text-xs text-slate-400">
                                By continuing, you agree to receive a one-time verification code. Standard rates may apply.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-4 text-center">One-Time Password (OTP)</label>
                                <div className="flex justify-center gap-2 sm:gap-3">
                                    {Array.from({ length: 6 }).map((_, idx) => (
                                        <input
                                            key={idx}
                                            ref={(el) => { otpInputRefs.current[idx] = el }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={otpCode[idx] || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (!/^[0-9]*$/.test(val)) return;

                                                const newOtpArr = otpCode.split('');
                                                for (let i = 0; i < 6; i++) { if (!newOtpArr[i]) newOtpArr[i] = ''; }

                                                newOtpArr[idx] = val;
                                                const newStr = newOtpArr.join('').slice(0, 6);
                                                setOtpCode(newStr);

                                                if (val && idx < 5) {
                                                    otpInputRefs.current[idx + 1]?.focus();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace') {
                                                    if (!otpCode[idx] && idx > 0) {
                                                        otpInputRefs.current[idx - 1]?.focus();
                                                    }
                                                }
                                            }}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
                                                if (pastedData) {
                                                    setOtpCode(pastedData);
                                                    otpInputRefs.current[Math.min(pastedData.length, 5)]?.focus();
                                                }
                                            }}
                                            className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white placeholder-transparent"
                                            placeholder="0"
                                        />
                                    ))}
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isProcessing || otpCode.length < 6}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none"
                            >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Unlock'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setOtpCode('');
                                    setSelectedChannel(null);
                                    onResend();
                                }}
                                className="w-full text-slate-500 text-sm font-medium hover:text-slate-800 transition-colors"
                            >
                                Resend Code
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
