import React from 'react';
import { Zap, CheckCircle2 } from 'lucide-react';

interface PatientHeaderProps {
    clinicName: string;
    isVerified: boolean;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({ clinicName, isVerified }) => {
    return (
        <div className={`bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-6 py-2 shadow-sm flex justify-between items-center shrink-0 transition-all ${!isVerified ? 'blur-sm opacity-50' : ''}`}>
            <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                    <Zap className="w-4 h-4 text-white fill-current" />
                </div>
                <span className="font-bold text-base md:text-xl text-slate-900 tracking-tight">wizex</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                    <p className="text-sm font-bold text-slate-900">{clinicName}</p>
                    <p className="text-[11px] text-slate-500">Secure Document Viewer</p>
                </div>
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
            </div>
        </div>
    );
};
