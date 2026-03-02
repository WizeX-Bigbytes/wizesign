import React, { useState, useEffect } from 'react';
import { FileText, Eye, Clock, CheckCircle, Send, AlertCircle, Search, Filter, MoreVertical, FileSignature, Sun, Moon, Calendar, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatDisplayDate, formatDisplayDateTime } from '../../utils/dateUtils';

interface Document {
    id: string;
    procedure_name: string;
    status: string;
    created_at: string;
    signed_date?: string;
    link_accessed_at?: string;
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
    initialSearchQuery?: string;
    onSearchChange: (query: string, status: string) => void;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({
    documents,
    onViewDocument,
    isLoading,
    initialSearchQuery,
    onSearchChange
}) => {
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');

    // Notify parent of filter changes with debounce for search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onSearchChange(searchQuery, statusFilter);
        }, 400); // 400ms debounce
        return () => clearTimeout(timeoutId);
    }, [searchQuery, statusFilter, onSearchChange]);

    const isDark = useAppStore(state => state.theme === 'dark');

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'SIGNED':
            case 'COMPLETED':
                return {
                    bg: isDark ? 'bg-emerald-950/30' : 'bg-emerald-50',
                    text: isDark ? 'text-emerald-400' : 'text-emerald-700',
                    border: isDark ? 'border-emerald-800/50' : 'border-emerald-200/60',
                    dot: 'bg-emerald-500',
                    icon: <CheckCircle className="w-3.5 h-3.5" />
                };
            case 'VIEWED':
                return {
                    bg: isDark ? 'bg-blue-950/30' : 'bg-blue-50',
                    text: isDark ? 'text-blue-400' : 'text-blue-700',
                    border: isDark ? 'border-blue-800/50' : 'border-blue-200/60',
                    dot: 'bg-blue-500',
                    icon: <Eye className="w-3.5 h-3.5" />
                };
            case 'SENT':
                return {
                    bg: isDark ? 'bg-amber-950/30' : 'bg-amber-50',
                    text: isDark ? 'text-amber-400' : 'text-amber-700',
                    border: isDark ? 'border-amber-800/50' : 'border-amber-200/60',
                    dot: 'bg-amber-500',
                    icon: <Send className="w-3.5 h-3.5" />
                };
            case 'EXPIRED':
                return {
                    bg: isDark ? 'bg-red-950/30' : 'bg-red-50',
                    text: isDark ? 'text-red-400' : 'text-red-700',
                    border: isDark ? 'border-red-800/50' : 'border-red-200/60',
                    dot: 'bg-red-500',
                    icon: <AlertCircle className="w-3.5 h-3.5" />
                };
            default:
                return {
                    bg: isDark ? 'bg-slate-900/50' : 'bg-slate-50',
                    text: isDark ? 'text-slate-400' : 'text-slate-700',
                    border: isDark ? 'border-slate-800/50' : 'border-slate-200/60',
                    dot: isDark ? 'bg-slate-600' : 'bg-slate-400',
                    icon: <Clock className="w-3.5 h-3.5" />
                };
        }
    };

    const statusCounts = {
        ALL: documents.length,
        SENT: documents.filter(d => d.status === 'SENT').length,
        VIEWED: documents.filter(d => d.status === 'VIEWED').length,
        SIGNED: documents.filter(d => d.status === 'SIGNED' || d.status === 'COMPLETED').length,
    };

    return (
        <div className={`w-full h-full flex flex-col relative px-2 md:px-4 pt-2 pb-8 transition-colors duration-300 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 shrink-0 transition-opacity">
                <div>
                    <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Sent Documents</h1>
                    <p className="text-slate-500 text-sm mt-1">Track and manage consent forms sent to patients</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full md:w-auto group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search patient or procedure..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full md:w-64 pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900'
                                }`}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className={`flex-1 flex flex-col min-h-0 border rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50 ${isDark ? 'bg-slate-900 border-slate-800 shadow-black/40' : 'bg-white border-slate-200'
                }`}>
                {/* Stats / Filters Header */}
                <div className={`p-1.5 border-b flex flex-wrap items-center gap-2 overflow-x-auto scrollbar-hide ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'
                    }`}>
                    <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'ALL'
                            ? (isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-white text-slate-900 shadow-sm border border-slate-200/60')
                            : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50')
                            }`}
                    >
                        All Documents
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusFilter === 'ALL' ? (isDark ? 'bg-blue-500' : 'bg-slate-100') : (isDark ? 'bg-slate-800' : 'bg-slate-200/60')}`}>
                            {statusCounts.ALL}
                        </span>
                    </button>
                    {['SENT', 'VIEWED', 'SIGNED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === status
                                ? (isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-white text-slate-900 shadow-sm border border-slate-200/60')
                                : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50')
                                }`}
                        >
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusFilter === status ? (isDark ? 'bg-blue-500' : 'bg-slate-100') : (isDark ? 'bg-slate-800' : 'bg-slate-200/60')}`}>
                                {statusCounts[status as keyof typeof statusCounts]}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="hidden md:block overflow-x-auto min-h-0 flex-1">
                    <table className="w-full text-left border-collapse min-w-[800px] whitespace-nowrap md:whitespace-normal">
                        <thead>
                            <tr className={`text-[11px] uppercase tracking-[0.1em] font-bold ${isDark ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-100'}`}>
                                <th className="px-8 py-5 border-b font-bold">Document</th>
                                <th className="px-8 py-5 border-b font-bold">Patient</th>
                                <th className="px-8 py-5 border-b font-bold">Status</th>
                                <th className="px-8 py-5 border-b font-bold">Timeline</th>
                                <th className="px-8 py-5 border-b font-bold text-right"></th>
                            </tr>
                        </thead>

                        <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100/50'}`}>
                            {/* Loading State inline */}
                            {isLoading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="animate-spin w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                                            <span className="text-sm font-medium text-slate-500">Searching documents...</span>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* Empty State inline */}
                            {!isLoading && documents.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center shadow-inner mb-4 border border-slate-100">
                                                <FileText className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="text-slate-900 font-bold text-lg mb-1">No documents found</h3>
                                            <p className="text-slate-500 text-sm">
                                                {searchQuery
                                                    ? `We couldn't find any documents matching "${searchQuery}".`
                                                    : statusFilter === 'ALL'
                                                        ? "You haven't sent any consent documents yet."
                                                        : `There are no documents currently in the ${statusFilter} status.`
                                                }
                                            </p>
                                            {statusFilter !== 'ALL' && !searchQuery && (
                                                <button
                                                    onClick={() => setStatusFilter('ALL')}
                                                    className="mt-6 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                                                >
                                                    View All Documents
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* Results */}
                            {!isLoading && documents.map((doc) => {
                                const statusStyle = getStatusStyle(doc.status);

                                return (
                                    <tr
                                        key={doc.id}
                                        className={`transition-all duration-200 group cursor-pointer ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/80'
                                            }`}
                                        onClick={() => onViewDocument(doc.id)}
                                    >
                                        <td className="px-8 py-6 align-middle">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${isDark ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className={`font-bold text-sm line-clamp-1 transition-colors ${isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-900'
                                                        }`}>
                                                        {doc.procedure_name}
                                                    </span>
                                                    <span className={`text-[11px] font-medium tracking-wide mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'
                                                        }`}>
                                                        ID: {doc.id.split('-')[0].toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-8 py-6 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${isDark
                                                    ? 'bg-indigo-950/30 text-indigo-400 border-indigo-900/50'
                                                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                    }`}>
                                                    {doc.patient.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                                                        {doc.patient.full_name}
                                                    </span>
                                                    {(doc.patient.phone || doc.patient.email) && (
                                                        <span className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                            {doc.patient.phone || doc.patient.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-8 py-6 align-middle">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} animate-pulse`}></span>
                                                {doc.status}
                                            </div>
                                        </td>

                                        <td className="px-8 py-6 align-middle">
                                            <div className="flex flex-col gap-1.5 group/timeline py-1">
                                                {/* Sent Status - Always present for sent docs */}
                                                <div className={`flex items-center gap-2 text-[11px] font-bold transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                    <span>Sent {formatDisplayDateTime(doc.created_at)}</span>
                                                </div>

                                                {/* Accessed Status */}
                                                {doc.link_accessed_at ? (
                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-blue-500 animate-in fade-in slide-in-from-left-2 duration-300">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        <span>Viewed {formatDisplayDateTime(doc.link_accessed_at)}</span>
                                                    </div>
                                                ) : (
                                                    <div className={`flex items-center gap-2 text-[11px] font-medium transition-all duration-300 ${isDark ? 'text-slate-600 group-hover/timeline:text-slate-500' : 'text-slate-300 group-hover/timeline:text-slate-400'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full border ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
                                                        <span>Not viewed yet</span>
                                                    </div>
                                                )}

                                                {/* Signed Status */}
                                                {(doc.signed_date) ? (
                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-500 animate-in fade-in slide-in-from-left-2 duration-500">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        <span>Signed {formatDisplayDateTime(doc.signed_date)}</span>
                                                    </div>
                                                ) : (
                                                    <div className={`flex items-center gap-2 text-[11px] font-medium transition-all duration-300 ${isDark ? 'text-slate-600 group-hover/timeline:text-slate-500' : 'text-slate-300 group-hover/timeline:text-slate-400'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full border ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
                                                        <span>Not signed yet</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-8 py-6 align-middle text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewDocument(doc.id);
                                                }}
                                                className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${isDark
                                                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
                                                    : 'bg-white text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-200 hover:shadow-md'
                                                    }`}
                                            >
                                                View
                                                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View (Cards) */}
                <div className={`md:hidden flex-1 overflow-y-auto p-3 space-y-3 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center space-y-3 py-10">
                            <div className="animate-spin w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                            <span className="text-xs font-medium text-slate-500">Searching documents...</span>
                        </div>
                    )}

                    {!isLoading && documents.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-inner ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-50 border border-slate-100'}`}>
                                <FileText className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-300'}`} />
                            </div>
                            <h3 className={`font-bold text-sm mb-1 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>No documents found</h3>
                            <p className="text-slate-500 text-xs px-4">
                                {searchQuery
                                    ? `No results for "${searchQuery}".`
                                    : statusFilter === 'ALL'
                                        ? "You haven't sent any consent documents yet."
                                        : `There are no documents currently in the ${statusFilter} status.`
                                }
                            </p>
                        </div>
                    )}

                    {!isLoading && documents.map((doc) => {
                        const statusStyle = getStatusStyle(doc.status);

                        return (
                            <div
                                key={doc.id}
                                onClick={() => onViewDocument(doc.id)}
                                className={`p-4 rounded-2xl border transition-all active:scale-[0.98] ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}
                            >
                                <div className="flex justify-between items-start mb-3 gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isDark ? 'bg-slate-900 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className={`font-bold text-sm leading-snug break-words ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                                                {doc.procedure_name}
                                            </span>
                                            <span className={`text-[10px] font-medium tracking-wide mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                ID: {doc.id.split('-')[0].toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} animate-pulse`}></span>
                                        {doc.status}
                                    </div>
                                </div>

                                <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isDark ? 'bg-indigo-950/50 text-indigo-400' : 'bg-white text-indigo-700 shadow-sm border border-indigo-100'}`}>
                                        {doc.patient.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className={`text-xs font-bold truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {doc.patient.full_name}
                                    </span>
                                </div>

                                <div className={`flex justify-between items-center mt-1 pt-3 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100/50'}`}>
                                    <div className="flex items-center">
                                        {doc.signed_date ? (
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span>Signed {formatDisplayDate(doc.signed_date)}</span>
                                            </div>
                                        ) : doc.link_accessed_at ? (
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                <span>Viewed {formatDisplayDate(doc.link_accessed_at)}</span>
                                            </div>
                                        ) : (
                                            <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                <span>Sent {formatDisplayDate(doc.created_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button className={`p-1.5 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination / Footer Placeholder */}
                {!isLoading && documents.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100/80 bg-slate-50/50 flex items-center justify-between text-sm text-slate-500">
                        <span>Showing <span className="font-semibold text-slate-900">{documents.length}</span> documents</span>
                    </div>
                )}
            </div>

        </div>
    );
};

