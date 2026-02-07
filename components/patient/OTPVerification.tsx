import React, { useState, useRef } from 'react';
import { Shield, Smartphone, ArrowRight, Loader2 } from 'lucide-react';

interface OTPVerificationProps {
    step: 'START' | 'OTP' | 'VERIFIED';
    isProcessing: boolean;
    onSendCode: () => void;
    onVerifyCode: (code: string) => void;
    onChangeNumber: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
    step,
    isProcessing,
    onSendCode,
    onVerifyCode,
    onChangeNumber
}) => {
    const [otpCode, setOtpCode] = useState('');
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    if (step === 'VERIFIED') return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length < 6) return;
        onVerifyCode(otpCode);
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
                            : "Enter the verification code sent to your mobile."}
                    </p>
                </div>

                <div className="p-6 md:p-8">
                    {step === 'START' ? (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                    <Smartphone className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Mobile Number</p>
                                    <p className="text-slate-900 font-mono font-medium">+1 (555) *** - 8821</p>
                                </div>
                            </div>
                            <button
                                onClick={onSendCode}
                                disabled={isProcessing}
                                className="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Verification Code <ArrowRight className="w-4 h-4" /></>}
                            </button>
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
                                    onChangeNumber();
                                }}
                                className="w-full text-slate-500 text-sm font-medium hover:text-slate-800 transition-colors"
                            >
                                Change Phone Number
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
