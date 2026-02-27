import React from 'react';
import { Loader2 } from 'lucide-react';
import { Language, translations } from '../../utils/translations';

interface StickyFooterProps {
    patientName: string;
    identityConfirmed: boolean;
    onIdentityChange: (checked: boolean) => void;
    agreed: boolean;
    onAgreedChange: (checked: boolean) => void;
    dataPrivacyAgreed: boolean;
    onDataPrivacyChange: (checked: boolean) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    canSubmit: boolean;
    lang: Language;
}

const Checkbox: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
    <div className="relative flex items-center flex-shrink-0">
        <input
            type="checkbox"
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded border-[1.5px] border-slate-300 bg-white transition-all checked:border-blue-600 checked:bg-blue-600 focus:ring-2 focus:ring-blue-200 focus:ring-offset-1"
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
        </div>
    </div>
);

export const StickyFooter: React.FC<StickyFooterProps> = ({
    patientName,
    identityConfirmed,
    onIdentityChange,
    agreed,
    onAgreedChange,
    dataPrivacyAgreed,
    onDataPrivacyChange,
    onSubmit,
    isSubmitting,
    canSubmit,
    lang
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const t = translations[lang];
    const fontClass = lang === 'ml' ? "font-['Noto_Sans_Malayalam']" : '';

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.08)] z-40 safe-area-pb transition-all animate-in slide-in-from-bottom duration-300">
            <div className="max-w-4xl mx-auto px-4 py-4 md:px-6 md:py-5 flex flex-col gap-4">

                {/* Collapsible Consent Checkboxes */}
                <div
                    className={`flex flex-col gap-4 ${fontClass} transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100 py-1' : 'max-h-0 opacity-0'
                        }`}
                >
                    {/* 1. Identity confirmation */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <Checkbox checked={identityConfirmed} onChange={onIdentityChange} />
                        <span className="text-slate-700 group-hover:text-slate-900 select-none text-sm leading-snug">
                            {t.confirmIdentity} <strong className="text-slate-900">{patientName}</strong>
                        </span>
                    </label>

                    {/* 2. E-signature consent */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="mt-0.5">
                            <Checkbox checked={agreed} onChange={onAgreedChange} />
                        </div>
                        <span className={`text-slate-600 group-hover:text-slate-800 select-none leading-relaxed ${lang === 'ml' ? 'text-[11px]' : 'text-[11px]'}`}>
                            {t.eSignConsent}
                        </span>
                    </label>

                    {/* 3. Data privacy (DPDP Act) */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="mt-0.5">
                            <Checkbox checked={dataPrivacyAgreed} onChange={onDataPrivacyChange} />
                        </div>
                        <span className={`text-slate-600 group-hover:text-slate-800 select-none leading-relaxed ${lang === 'ml' ? 'text-[11px]' : 'text-[11px]'}`}>
                            {t.dataPrivacyConsent}
                        </span>
                    </label>
                </div>

                {/* Primary Action Button */}
                {!isExpanded ? (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-[15px] shadow-lg shadow-blue-600/20 flex items-center justify-center transition-all transform active:scale-[0.99] ${fontClass}`}
                        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        Review Terms to Sign
                    </button>
                ) : (
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={onSubmit}
                            disabled={!canSubmit || isSubmitting}
                            className={`w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-bold text-[15px] shadow-lg shadow-slate-900/20 disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.99] ${fontClass}`}
                            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : t.agreeAndSign}
                        </button>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-xs text-slate-500 hover:text-slate-700 py-2 font-medium transition-colors"
                        >
                            Hide Terms
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
