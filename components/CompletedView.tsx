import React, { useEffect } from 'react'; // Added useEffect
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle, Download, Shield, Clock, Zap } from 'lucide-react';

export const CompletedView: React.FC = () => {
    const navigate = useNavigate();
    const { consentForm, patientDetails, resetSession } = useAppStore();

    const handleFinish = () => {
        resetSession();
        navigate('/');
    };

    // Redirect if accessed directly without data (optional but good practice)
    /* useEffect(() => {
       if (!consentForm.signedDate) {
           navigate('/');
       }
    }, [consentForm.signedDate, navigate]); */

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Navbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-center md:justify-start">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <Zap className="w-5 h-5 text-white fill-current" />
                    </div>
                    <span className="font-bold text-xl text-slate-900 tracking-tight">wizex</span>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-3xl w-full space-y-6">

                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">All Done!</h1>
                        <p className="text-slate-500 max-w-md mx-auto">
                            The document has been securely signed, sealed, and delivered to <strong>{consentForm.clinicName}</strong>.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex justify-between items-center">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-600" />
                                Digital Certificate
                            </h2>
                            <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded">
                                #{consentForm.transactionId?.substring(0, 8)}
                            </span>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm border-b border-slate-100 pb-8">
                                <div><span className="block text-slate-400 text-xs uppercase font-bold mb-1">Procedure</span><span className="font-semibold text-slate-900">{consentForm.procedureName}</span></div>
                                <div><span className="block text-slate-400 text-xs uppercase font-bold mb-1">Signer</span><span className="font-semibold text-slate-900">{patientDetails.fullName}</span></div>
                                <div><span className="block text-slate-400 text-xs uppercase font-bold mb-1">Date</span><span className="font-semibold text-slate-900">{new Date(consentForm.signedDate!).toLocaleDateString()}</span></div>
                                <div><span className="block text-slate-400 text-xs uppercase font-bold mb-1">Status</span><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Verified</span></div>
                            </div>

                            <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                {consentForm.signature ? (
                                    <>
                                        <img src={consentForm.signature} alt="Digital Signature" className="h-20 object-contain" />
                                        <p className="text-xs text-slate-400 mt-2 font-mono">Digitally Signed by {patientDetails.fullName}</p>
                                    </>
                                ) : (
                                    <p className="text-red-500">Signature Verification Failed</p>
                                )}
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <Clock className="w-4 h-4 text-slate-400" /> Audit History
                                </h3>
                                <div className="relative border-l-2 border-slate-100 ml-2 space-y-6 pb-2">
                                    {consentForm.auditTrail?.map((event, index) => (
                                        <div key={index} className="pl-6 relative">
                                            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-blue-100 ring-1 ring-blue-500" />
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{event.action.replace('_', ' ')}</p>
                                                    <p className="text-slate-500 text-xs mt-0.5">{event.details}</p>
                                                </div>
                                                <span className="text-xs font-mono text-slate-400 mt-1 sm:mt-0">{new Date(event.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-between items-center">
                            <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-bold">
                                <Download className="w-4 h-4" /> Download PDF
                            </button>
                            <button onClick={handleFinish} className="text-blue-600 hover:text-blue-700 text-sm font-bold hover:underline">
                                Start New Session
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};