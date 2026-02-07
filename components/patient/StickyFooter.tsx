import React from 'react';
import { Loader2 } from 'lucide-react';

interface StickyFooterProps {
    patientName: string;
    identityConfirmed: boolean;
    onIdentityChange: (checked: boolean) => void;
    agreed: boolean;
    onAgreedChange: (checked: boolean) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    canSubmit: boolean;
}

export const StickyFooter: React.FC<StickyFooterProps> = ({
    patientName,
    identityConfirmed,
    onIdentityChange,
    agreed,
    onAgreedChange,
    onSubmit,
    isSubmitting,
    canSubmit
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 safe-area-pb transition-all animate-in slide-in-from-bottom duration-300">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-2 text-sm w-full md:w-auto px-1">
                    <label className="flex items-center gap-3 cursor-pointer group p-1 md:p-0">
                        <div className="relative flex items-center">
                            <input type="checkbox" checked={identityConfirmed} onChange={e => onIdentityChange(e.target.checked)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white transition-all checked:border-blue-600 checked:bg-blue-600 focus:ring-2 focus:ring-blue-200" />
                            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </div>
                        </div>
                        <span className="text-slate-700 group-hover:text-slate-900 select-none">I confirm I am <strong>{patientName}</strong></span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group p-1 md:p-0">
                        <div className="relative flex items-center">
                            <input type="checkbox" checked={agreed} onChange={e => onAgreedChange(e.target.checked)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white transition-all checked:border-blue-600 checked:bg-blue-600 focus:ring-2 focus:ring-blue-200" />
                            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </div>
                        </div>
                        <span className="text-slate-700 group-hover:text-slate-900 select-none">I agree to the terms & conditions</span>
                    </label>
                </div>
                <button
                    onClick={onSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Complete Signing'}
                </button>
            </div>
        </div>
    );
};
