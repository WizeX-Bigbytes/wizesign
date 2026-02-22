import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useSubmitSignature, useDocumentByToken } from '../hooks/useAppQueries';
import { AuditEvent } from '../types';
import { SignaturePad } from './SignaturePad';
import { X, Loader2, AlertCircle } from 'lucide-react';

import { OTPVerification } from './patient/OTPVerification';
import { PatientHeader } from './patient/PatientHeader';
import { DocumentViewer } from './patient/DocumentViewer';
import { StickyFooter } from './patient/StickyFooter';

import { toast } from 'sonner';

export const PatientView: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    // Store Actions
    const {
        consentForm, patientDetails, updateConsentForm,
        updatePatientDetails, startWizeChatSession
    } = useAppStore();

    // Queries
    const { data: documentData, isLoading, error } = useDocumentByToken(token);
    const { mutate: submit, isPending: isSubmitting } = useSubmitSignature();

    // Local State
    const [signature, setSignature] = useState<string>('');
    const [agreed, setAgreed] = useState(false);
    const [identityConfirmed, setIdentityConfirmed] = useState(false);
    const [ipAddress, setIpAddress] = useState('Loading...');
    const [showSignModal, setShowSignModal] = useState(false);
    const [verificationStep, setVerificationStep] = useState<'START' | 'OTP' | 'VERIFIED'>('START');
    const [isProcessingOtp, setIsProcessingOtp] = useState(false);

    // Initial Data Sync when document loads
    useEffect(() => {
        if (documentData && documentData.patient) {
            // Populate store with fetched data
            startWizeChatSession(
                {
                    id: documentData.patient.id || 'unknown',
                    fullName: documentData.patient.full_name,
                    email: documentData.patient.email || '',
                    phone: documentData.patient.phone || '',
                    dob: documentData.patient.dob || ''
                },
                {
                    procedureName: documentData.procedure_name,
                    doctorName: documentData.doctor_name || 'Your Doctor',
                    clinicName: documentData.clinic_name || 'Wizex Medical',
                    fileUrl: documentData.file_url,
                    fields: documentData.fields?.map((f: any) => ({
                        ...f,
                        w: f.w || 20,
                        h: f.h || 5,
                        fontSize: f.fontSize || 14
                    })) || [],
                    generatedDate: documentData.created_at,
                    transactionId: documentData.id, // Use ID for signing
                    auditTrail: documentData.audit_trail || []
                }
            );

            // If already viewed/signed, handle accordingly (optional logic)
            if (documentData.status !== 'SENT' && documentData.status !== 'VIEWED') {
                // Maybe redirect or show status
            }
        }
    }, [documentData, startWizeChatSession]);

    // IP Address handling
    useEffect(() => {
        // Fetch public IP for audit trail
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setIpAddress(data.ip))
            .catch(() => setIpAddress('Unknown'));
    }, []);

    const handleSendOtp = async () => {
        setIsProcessingOtp(true);
        try {
            // Call real OTP API
            const response = await fetch(`/api/documents/${consentForm.transactionId}/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to send OTP');
            }

            const data = await response.json();
            setVerificationStep('OTP');

            // Auto-fill OTP for testing if provided (Dev Mode)
            if (data.dev_otp) {
                toast.info(`🔐 DEV MODE: OTP is ${data.dev_otp}`);
                console.log('Auto-filling OTP:', data.dev_otp);

                // Small delay to allow UI transition
                setTimeout(() => {
                    handleVerifyOtp(data.dev_otp);
                }, 1000);
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            alert('Failed to send OTP. Please try again.');
        } finally {
            setIsProcessingOtp(false);
        }
    };

    const handleVerifyOtp = async (code: string) => {
        setIsProcessingOtp(true);
        try {
            // Call real OTP verification API
            const response = await fetch(`/api/documents/${consentForm.transactionId}/verify-otp?otp_code=${code}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Invalid OTP code');
            }

            setVerificationStep('VERIFIED');
        } catch (error) {
            console.error('Error verifying OTP:', error);
            alert(error instanceof Error ? error.message : 'Invalid OTP code. Please try again.');
        } finally {
            setIsProcessingOtp(false);
        }
    };

    const handleSignatureSave = (sigData: string) => {
        setSignature(sigData);
        setShowSignModal(false);
    };

    const handleSubmit = () => {
        if (!signature || !agreed || !identityConfirmed) return;

        const timestamp = new Date().toISOString();
        const newAuditEvents: AuditEvent[] = [
            { timestamp, action: 'IDENTITY_VERIFIED', actor: patientDetails.fullName, details: 'OTP verification completed via mobile' },
            { timestamp, action: 'DOCUMENT_ACCESSED', actor: patientDetails.fullName, details: `IP: ${ipAddress}, User-Agent: ${navigator.userAgent.substring(0, 50)}` },
            { timestamp, action: 'IDENTITY_CONFIRMED', actor: patientDetails.fullName, details: 'Signer confirmed their identity' },
            { timestamp, action: 'E_SIGNATURE_CONSENT', actor: patientDetails.fullName, details: 'Consented to electronic signature use and terms' },
            { timestamp, action: 'DOCUMENT_REVIEWED', actor: patientDetails.fullName, details: 'Document content reviewed by signer' },
            { timestamp, action: 'SIGNATURE_APPLIED', actor: patientDetails.fullName, details: 'Electronic signature created and applied' },
            { timestamp, action: 'SIGNATURE_SUBMITTED', actor: patientDetails.fullName, details: `Final submission with intent to sign, IP: ${ipAddress}` }
        ];

        // Store update for immediate UI feedback
        updateConsentForm({
            signature,
            signedDate: new Date().toISOString(),
            auditTrail: [...(consentForm.auditTrail || []), ...newAuditEvents]
        });

        // Backend submission
        submit({
            formId: consentForm.transactionId!, // This is actually the document ID from API
            signature,
            auditEvents: newAuditEvents
        }, {
            onSuccess: (data) => {
                // Update store with certificate data from response
                updateConsentForm({
                    signature,
                    signedDate: new Date().toISOString(),
                    auditTrail: [...(consentForm.auditTrail || []), ...newAuditEvents],
                    certificateHash: data.certificate_hash,
                    certificateIssuedAt: data.certificate_issued_at
                });
                toast.success("Document signed successfully!");
                navigate('/completed');
            },
            onError: (err) => {
                toast.error("Failed to sign document. Please try again.");
                console.error(err);
            }
        });
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                    <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Link</h2>
                    <p className="text-slate-500">This secure link is invalid or missing a token.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Loading secure document...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                    <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Unavailable</h2>
                    <p className="text-slate-500">{(error as any).message || 'This document cannot be accessed at the moment.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-32 md:pb-24 flex flex-col relative">

            {/* OTP Verification Overlay */}
            <OTPVerification
                step={verificationStep}
                isProcessing={isProcessingOtp}
                onSendCode={handleSendOtp}
                onVerifyCode={handleVerifyOtp}
                patientPhone={patientDetails.phone}
            />

            {/* Brand Header */}
            <PatientHeader
                clinicName={consentForm.clinicName}
                isVerified={verificationStep === 'VERIFIED'}
            />

            <div className={`flex-1 w-full max-w-5xl mx-auto p-2 md:p-8 flex flex-col transition-all ${verificationStep !== 'VERIFIED' ? 'blur-md pointer-events-none select-none opacity-50 overflow-hidden h-screen' : ''}`}>

                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Action Required</h2>
                        <p className="text-slate-500 text-sm">Please review the document below and provide your signature.</p>
                    </div>
                    <div className="flex gap-2 text-xs font-medium bg-blue-50 text-blue-700 px-3 py-2 rounded-lg items-center self-start">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Awaiting Signature
                    </div>
                </div>

                {/* Document Viewer */}
                <DocumentViewer
                    fileUrl={consentForm.fileUrl || ''}
                    fields={consentForm.fields}
                    signature={signature}
                    onSignClick={() => setShowSignModal(true)}
                    patientName={patientDetails.fullName}
                />
            </div>

            {/* Floating Bottom Bar (Only visible when verified) */}
            {verificationStep === 'VERIFIED' && (
                <StickyFooter
                    patientName={patientDetails.fullName}
                    identityConfirmed={identityConfirmed}
                    onIdentityChange={setIdentityConfirmed}
                    agreed={agreed}
                    onAgreedChange={setAgreed}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    canSubmit={!!(signature && agreed && identityConfirmed)}
                />
            )}

            {showSignModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Sign Document</h3>
                                <p className="text-xs text-slate-500">Please sign in the box below</p>
                            </div>
                            <button onClick={() => setShowSignModal(false)} className="bg-white p-2 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 md:p-6 bg-white flex-1 overflow-y-auto">
                            <SignaturePad onSave={handleSignatureSave} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};