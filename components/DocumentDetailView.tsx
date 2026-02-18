import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, FileText, User, Calendar, Clock, CheckCircle, Mail, Phone, Download } from 'lucide-react';

export const DocumentDetailView: React.FC = () => {
    const { documentId } = useParams<{ documentId: string }>();
    const navigate = useNavigate();
    const [document, setDocument] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDocument();
    }, [documentId]);

    const loadDocument = async () => {
        if (!documentId) return;
        
        setIsLoading(true);
        try {
            const doc = await api.getDocument(documentId);
            setDocument(doc);
        } catch (err: any) {
            setError(err.message || 'Failed to load document');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SIGNED':
            case 'COMPLETED':
                return 'text-green-700 bg-green-50 border-green-200';
            case 'VIEWED':
                return 'text-blue-700 bg-blue-50 border-blue-200';
            case 'SENT':
                return 'text-yellow-700 bg-yellow-50 border-yellow-200';
            case 'EXPIRED':
                return 'text-red-700 bg-red-50 border-red-200';
            default:
                return 'text-slate-700 bg-slate-50 border-slate-200';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error || !document) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-4">
                <div className="text-red-600 text-xl font-bold mb-2">Error Loading Document</div>
                <p className="text-slate-600 mb-4">{error || 'Document not found'}</p>
                <button
                    onClick={() => navigate('/doctor/dashboard')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-6">
            <div className="max-w-5xl mx-auto space-y-6 pb-12">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/doctor/dashboard')}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(document.status)}`}>
                        {document.status === 'SIGNED' && <CheckCircle className="w-4 h-4" />}
                        <span>{document.status}</span>
                    </div>
                </div>

                {/* Document Info Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                        <div className="flex items-start gap-4">
                            <FileText className="w-12 h-12" />
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold mb-2">{document.procedure_name}</h1>
                                <div className="flex flex-wrap gap-4 text-blue-100 text-sm">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>Sent: {new Date(document.created_at).toLocaleString()}</span>
                                    </div>
                                    {document.signed_date && (
                                        <div className="flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Signed: {new Date(document.signed_date).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Patient Information */}
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />
                                Patient Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
                                <div>
                                    <div className="text-sm text-slate-500 mb-1">Full Name</div>
                                    <div className="font-semibold text-slate-900">{document.patient.full_name}</div>
                                </div>
                                {document.patient.email && (
                                    <div>
                                        <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            Email
                                        </div>
                                        <div className="font-medium text-slate-900">{document.patient.email}</div>
                                    </div>
                                )}
                                {document.patient.phone && (
                                    <div>
                                        <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            Phone
                                        </div>
                                        <div className="font-medium text-slate-900">{document.patient.phone}</div>
                                    </div>
                                )}
                                {document.patient.dob && (
                                    <div>
                                        <div className="text-sm text-slate-500 mb-1">Date of Birth</div>
                                        <div className="font-medium text-slate-900">{document.patient.dob}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Document Details */}
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Document Details
                            </h2>
                            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Doctor Name</span>
                                    <span className="font-semibold text-slate-900">{document.doctor_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Clinic Name</span>
                                    <span className="font-semibold text-slate-900">{document.clinic_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Fields</span>
                                    <span className="font-semibold text-slate-900">{document.fields?.length || 0} configured</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Link Accessed</span>
                                    <span className="font-semibold text-slate-900">
                                        {document.link_accessed ? (
                                            <span className="text-green-600 flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" />
                                                Yes - {document.link_accessed_at ? new Date(document.link_accessed_at).toLocaleString() : ''}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">Not yet</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Signature */}
                        {document.signature && (
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    Patient Signature
                                </h2>
                                <div className="bg-slate-50 rounded-xl p-6 border-2 border-green-200">
                                    <img 
                                        src={document.signature} 
                                        alt="Patient Signature" 
                                        className="max-w-md mx-auto bg-white border-2 border-slate-200 rounded-lg p-4"
                                    />
                                    {document.signed_date && (
                                        <div className="text-center mt-4 text-sm text-slate-600">
                                            Signed on {new Date(document.signed_date).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Digital Certificate */}
                        {document.certificate_hash && (
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                    Digital Certificate
                                </h2>
                                <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-6 border-2 border-blue-200">
                                    <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Certificate ID</span>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">VERIFIED</span>
                                        </div>
                                        <div className="font-mono text-xs text-slate-700 break-all bg-slate-50 p-3 rounded border border-slate-200">
                                            {document.certificate_hash}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                                            <div>
                                                <div className="text-xs text-slate-500 mb-1">Issued To</div>
                                                <div className="font-semibold text-slate-900 text-sm">{document.patient.full_name}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 mb-1">Issued On</div>
                                                <div className="font-semibold text-slate-900 text-sm">
                                                    {document.certificate_issued_at 
                                                        ? new Date(document.certificate_issued_at).toLocaleString()
                                                        : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-slate-100">
                                            <div className="text-xs text-slate-500 mb-2">Document Hash (SHA-256)</div>
                                            <div className="font-mono text-[10px] text-slate-600 break-all bg-slate-50 p-2 rounded">
                                                {document.certificate_hash.substring(0, 32)}...{document.certificate_hash.substring(document.certificate_hash.length - 32)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                            <span>This certificate is cryptographically secured and tamper-proof</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Document Preview */}
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Document Preview</h2>
                            <div className="bg-slate-50 rounded-xl p-6">
                                {document.file_url ? (
                                    <div className="space-y-4">
                                        <div className="relative w-full bg-white rounded-lg shadow-lg overflow-hidden">
                                            <img 
                                                src={document.file_url} 
                                                alt="Document" 
                                                className="w-full"
                                            />
                                            {/* Render fields on top of the document */}
                                            {document.fields && document.fields.length > 0 && (
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {document.fields.map((field: any) => {
                                                        if (!field.value && field.type !== 'SIGNATURE') return null;
                                                        
                                                        return (
                                                            <div
                                                                key={field.id}
                                                                style={{
                                                                    position: 'absolute',
                                                                    left: `${field.x}%`,
                                                                    top: `${field.y}%`,
                                                                    width: `${field.w}%`,
                                                                    height: `${field.h}%`,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: field.textAlign || 'left',
                                                                    padding: '4px',
                                                                }}
                                                            >
                                                                {field.type === 'SIGNATURE' && document.signature ? (
                                                                    <img 
                                                                        src={document.signature} 
                                                                        alt="Signature" 
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            objectFit: 'contain'
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div
                                                                        style={{
                                                                            fontSize: field.fontSize ? `${field.fontSize}px` : '14px',
                                                                            fontWeight: field.fontWeight || 'normal',
                                                                            color: '#1e293b',
                                                                            width: '100%',
                                                                            textAlign: field.textAlign || 'left',
                                                                            wordWrap: 'break-word',
                                                                        }}
                                                                    >
                                                                        {field.value}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-center">
                                            <a 
                                                href={document.file_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download Document
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12">
                                        <div className="text-center space-y-3">
                                            <FileText className="w-16 h-16 text-slate-300 mx-auto" />
                                            <div className="text-slate-900 font-bold text-lg">Document Summary</div>
                                            <div className="text-slate-600 space-y-2 max-w-md mx-auto">
                                                <div className="flex justify-between px-4 py-2 bg-slate-50 rounded-lg">
                                                    <span className="text-slate-500">Procedure:</span>
                                                    <span className="font-semibold">{document.procedure_name}</span>
                                                </div>
                                                <div className="flex justify-between px-4 py-2 bg-slate-50 rounded-lg">
                                                    <span className="text-slate-500">Status:</span>
                                                    <span className="font-semibold capitalize">{document.status}</span>
                                                </div>
                                                <div className="flex justify-between px-4 py-2 bg-slate-50 rounded-lg">
                                                    <span className="text-slate-500">Patient:</span>
                                                    <span className="font-semibold">{document.patient.full_name}</span>
                                                </div>
                                                <div className="flex justify-between px-4 py-2 bg-slate-50 rounded-lg">
                                                    <span className="text-slate-500">Created:</span>
                                                    <span className="font-semibold">{new Date(document.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Patient Link */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                            <div className="text-sm font-bold text-blue-900 mb-2">Patient Link</div>
                            {document.patient_link ? (
                                <div className="space-y-2">
                                    <div className="bg-white rounded-lg p-3 font-mono text-xs text-slate-600 break-all">
                                        {document.patient_link}
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(document.patient_link);
                                            alert('Link copied to clipboard!');
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        📋 Copy Link
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg p-3 text-sm text-slate-500 text-center">
                                    No patient link generated yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
