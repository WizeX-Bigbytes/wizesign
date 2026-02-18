import React, { useEffect, useState } from 'react'; // Added useEffect and useState
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle, Download, Shield, Clock, Zap } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

export const CompletedView: React.FC = () => {
    const navigate = useNavigate();
    const { consentForm, patientDetails, resetSession } = useAppStore();
    const [isDownloading, setIsDownloading] = useState(false);

    const handleFinish = () => {
        resetSession();
        navigate('/');
    };

    const handleDownload = async () => {
        if (!consentForm.transactionId) {
            toast.error('Document ID not found');
            return;
        }

        setIsDownloading(true);
        try {
            // Fetch the PDF blob
            const blob = await api.downloadSignedDocument(consentForm.transactionId);
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${consentForm.procedureName.replace(/\s+/g, '_')}_signed_${patientDetails.fullName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success('Document downloaded successfully!');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download document. Please try again.');
        } finally {
            setIsDownloading(false);
        }
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

                            {consentForm.certificateHash && (
                                <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-6 border-2 border-blue-200">
                                    <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Certificate ID</span>
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">VERIFIED</span>
                                        </div>
                                        <div className="font-mono text-[10px] text-slate-700 break-all bg-slate-50 p-3 rounded border border-slate-200">
                                            {consentForm.certificateHash}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                            <span>This certificate is cryptographically secured and tamper-proof</span>
                                        </div>
                                        {consentForm.certificateIssuedAt && (
                                            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                                                Issued: {new Date(consentForm.certificateIssuedAt).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

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

                        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-center items-center">
                            <button 
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                            >
                                <Download className="w-4 h-4" /> 
                                {isDownloading ? 'Downloading...' : 'Download Signed PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};