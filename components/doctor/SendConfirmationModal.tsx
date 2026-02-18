import React from 'react';
import { X, Check, Mail, Smartphone, User, FileText, Calendar, AlertCircle } from 'lucide-react';
import { PatientDetails, ConsentForm } from '../../types';
import { api } from '../../services/api';

interface SendConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    patientDetails: PatientDetails;
    form: ConsentForm;
    isSending: boolean;
    patientLink?: string;
}

export const SendConfirmationModal: React.FC<SendConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    patientDetails,
    form,
    isSending,
    patientLink
}) => {
    const [linkCopied, setLinkCopied] = React.useState(false);
    const [wizechatStatus, setWizechatStatus] = React.useState<any>(null);
    const [checkingStatus, setCheckingStatus] = React.useState(true);
    
    React.useEffect(() => {
        if (isOpen) {
            checkWizeChatStatus();
        }
    }, [isOpen]);

    const checkWizeChatStatus = async () => {
        try {
            setCheckingStatus(true);
            const status = await api.getWizeChatStatus();
            setWizechatStatus(status);
        } catch (error) {
            console.error('Failed to check WizeChat status', error);
            setWizechatStatus({ configured: false, message: 'Failed to check configuration' });
        } finally {
            setCheckingStatus(false);
        }
    };
    
    const copyToClipboard = () => {
        if (patientLink) {
            navigator.clipboard.writeText(patientLink);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };
    
    if (!isOpen) return null;

    const hasPhoneNumber = !!patientDetails.phone;
    const canSend = wizechatStatus?.configured && hasPhoneNumber && !checkingStatus;

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
                                <span className="text-sm font-medium text-slate-900">{patientDetails.phone || 'Not provided'}</span>
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

                    {/* Patient Link Preview */}
                    {patientLink && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <h3 className="text-sm font-bold text-green-900 uppercase tracking-wide">Patient Link</h3>
                            </div>
                            <div className="bg-white border border-green-200 rounded-lg p-3 mb-2">
                                <p className="text-xs font-mono text-slate-600 break-all">{patientLink}</p>
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="text-xs font-medium text-green-700 hover:text-green-800 flex items-center gap-1"
                            >
                                {linkCopied ? (
                                    <>
                                        <Check className="w-3 h-3" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy Link
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    <div className="flex items-start gap-3 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs leading-relaxed">
                        <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>The patient will receive this secure link via WhatsApp. They can review and sign the document on their mobile device.</p>
                    </div>

                    {/* WizeChat Configuration Status */}
                    {checkingStatus ? (
                        <div className="flex items-center gap-3 p-3 bg-slate-100 text-slate-600 rounded-lg text-xs">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                            <p>Checking WizeChat configuration...</p>
                        </div>
                    ) : !wizechatStatus?.configured ? (
                        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs leading-relaxed">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                            <div>
                                <p className="font-semibold mb-1">WizeChat Not Configured</p>
                                <p>{wizechatStatus?.message}</p>
                                <p className="mt-1">Please configure WizeChat in Settings before sending documents.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs leading-relaxed">
                            <Check className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                            <p>WizeChat is configured and ready to send messages</p>
                        </div>
                    )}

                    {/* Phone Number Validation */}
                    {!hasPhoneNumber && (
                        <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg text-xs leading-relaxed">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-orange-600" />
                            <p>Patient phone number is required to send via WhatsApp</p>
                        </div>
                    )}
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
                        disabled={isSending || !canSend}
                        className="flex-[2] py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        title={!canSend ? (checkingStatus ? 'Checking configuration...' : !wizechatStatus?.configured ? 'WizeChat not configured' : 'Phone number required') : ''}
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
