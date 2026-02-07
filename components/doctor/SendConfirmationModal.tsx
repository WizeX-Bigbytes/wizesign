import React from 'react';
import { X, Check, Mail, Smartphone, User, FileText, Calendar } from 'lucide-react';
import { PatientDetails, ConsentForm } from '../../types';

interface SendConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    patientDetails: PatientDetails;
    form: ConsentForm;
    isSending: boolean;
}

export const SendConfirmationModal: React.FC<SendConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    patientDetails,
    form,
    isSending
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Review & Send</h2>
                        <p className="text-slate-500 text-sm">Please verify the details before sending.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Patient Card */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">Patient Details</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Name</span>
                                <span className="text-sm font-semibold text-slate-900">{patientDetails.fullName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Email</span>
                                <span className="text-sm font-medium text-slate-900">{patientDetails.email || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Phone</span>
                                <span className="text-sm font-medium text-slate-900">+1 (555) 123-4567</span> {/* TODO: Add phone to type */}
                            </div>
                        </div>
                    </div>

                    {/* Document Card */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-4 h-4 text-slate-600" />
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Document Details</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Procedure</span>
                                <span className="text-sm font-semibold text-slate-900">{form.procedureName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Fields</span>
                                <span className="text-sm font-medium text-slate-900">{form.fields?.length || 0} fields configured</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Link Expiry</span>
                                <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                                    <ClockIcon className="w-3 h-3" />
                                    <span>7 Days</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs leading-relaxed">
                        <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>The patient will receive a secure link via WhatsApp. They can review and sign the document on their mobile device.</p>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all"
                    >
                        Back
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSending}
                        className="flex-[2] py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isSending ? (
                            <>Sending...</>
                        ) : (
                            <>
                                <Mail className="w-4 h-4" />
                                Confirm & Send
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper icon
const ClockIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
