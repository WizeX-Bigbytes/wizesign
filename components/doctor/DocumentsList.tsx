import React, { useState } from 'react';
import { FileText, Eye, Clock, CheckCircle, Send, AlertCircle, Search, Filter } from 'lucide-react';

interface Document {
    id: string;
    procedure_name: string;
    status: string;
    created_at: string;
    signed_date?: string;
    patient: {
        full_name: string;
        email?: string;
        phone?: string;
    };
    patient_link: string;
}

interface DocumentsListProps {
    documents: Document[];
    onViewDocument: (documentId: string) => void;
    isLoading?: boolean;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({ 
    documents, 
    onViewDocument,
    isLoading 
}) => {
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SIGNED':
            case 'COMPLETED':
                return <CheckCircle className="w-4 h-4" />;
            case 'VIEWED':
                return <Eye className="w-4 h-4" />;
            case 'SENT':
                return <Send className="w-4 h-4" />;
            case 'EXPIRED':
                return <AlertCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
        const matchesSearch = 
            doc.procedure_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.patient.email && doc.patient.email.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const statusCounts = {
        ALL: documents.length,
        SENT: documents.filter(d => d.status === 'SENT').length,
        VIEWED: documents.filter(d => d.status === 'VIEWED').length,
        SIGNED: documents.filter(d => d.status === 'SIGNED' || d.status === 'COMPLETED').length,
    };

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col relative px-4 md:px-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 shrink-0 pt-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sent Documents</h1>
                    <p className="text-slate-500 text-sm mt-1">Track status and view signed consent forms</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full md:w-auto group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search patient or document..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-64 pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm transition-all" 
                        />
                    </div>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 border-b border-slate-100 mb-6 shrink-0">
                {(['ALL', 'SENT', 'VIEWED', 'SIGNED'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                            statusFilter === status
                                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                                : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        {status === 'ALL' && <Filter className="w-3.5 h-3.5" />}
                        {status === 'SENT' && <Send className="w-3.5 h-3.5" />}
                        {status === 'VIEWED' && <Eye className="w-3.5 h-3.5" />}
                        {status === 'SIGNED' && <CheckCircle className="w-3.5 h-3.5" />}
                        {status} 
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                             statusFilter === status ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                            {statusCounts[status]}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4 pb-6">
                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                )}

                {/* Empty States */}
                {!isLoading && filteredDocuments.length === 0 && (
                    <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4 border border-slate-100">
                            <FileText className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg mb-1">No documents found</h3>
                        <p className="text-slate-500 text-sm">
                            {searchQuery 
                                ? `No results matching "${searchQuery}"`
                                : statusFilter === 'ALL'
                                    ? "You haven't sent any documents yet."
                                    : `No documents with status ${statusFilter}`
                            }
                        </p>
                        {statusFilter !== 'ALL' && !searchQuery && (
                             <button 
                                onClick={() => setStatusFilter('ALL')}
                                className="mt-4 text-blue-600 text-sm font-bold hover:underline"
                            >
                                View All Documents
                            </button>
                        )}
                    </div>
                )}

                {/* Documents Grid */}
                {!isLoading && filteredDocuments.length > 0 && (
                    <div className="grid gap-4 pb-8">
                        {filteredDocuments.map((doc) => (
                            <div
                                key={doc.id}
                                className="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/5 transition-all p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                            >
                                <div className="flex items-start gap-4 min-w-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                        doc.status === 'SIGNED' || doc.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                                        doc.status === 'VIEWED' ? 'bg-blue-50 text-blue-600' :
                                        'bg-yellow-50 text-yellow-600'
                                    }`}>
                                        {getStatusIcon(doc.status)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 truncate">
                                            {doc.procedure_name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mt-1">
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                    {doc.patient.full_name.charAt(0)}
                                                </div>
                                                <span className="font-medium">{doc.patient.full_name}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                                <Clock className="w-3 h-3" />
                                                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto pl-14 sm:pl-0">
                                    <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(doc.status)}`}>
                                        <span>{doc.status}</span>
                                    </div>
                                    
                                    <button
                                        onClick={() => onViewDocument(doc.id)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-all whitespace-nowrap"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

