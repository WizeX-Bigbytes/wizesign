import React, { useState, useRef, useEffect } from 'react';
import {
    FileText, Plus, Search, MoreHorizontal, Clock, Edit2, Trash2, Check, Sun, Moon
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatDisplayDate, formatDisplayDateTime } from '../../utils/dateUtils';

interface Template {
    id: string;
    name: string;
    url: string;
    created_at?: string;
    updatedAt?: string;
    category?: string;
    fields?: any[];
}

interface TemplateListProps {
    templates: Template[] | undefined;
    onSelect: (url: string, name: string, templateId?: string, fields?: any[]) => void;
    onCreate: () => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    onBulkDelete?: (ids: string[]) => void;
    onViewDocuments?: (templateName: string) => void;
    onDuplicate?: (id: string) => void;
}

const DocumentPreviewIcon = ({ isDark }: { isDark: boolean }) => (
    <div className={`relative w-24 h-32 rounded-xl p-3 flex flex-col gap-2 transition-all duration-500 group-hover:-translate-y-2 group-hover:rotate-1 ${isDark
        ? 'bg-slate-800 shadow-[20px_20px_40px_-15px_rgba(0,0,0,0.4)] border-slate-700'
        : 'bg-white shadow-[20px_20px_40px_-15px_rgba(0,0,0,0.1)] border-slate-200'
        } border`}>
        {/* Decorative Header */}
        <div className="flex gap-2 items-center mb-1">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            </div>
            <div className="flex-1 space-y-1">
                <div className={`h-1 rounded-full w-3/4 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                <div className={`h-1 rounded-full w-1/2 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
            </div>
        </div>
        {/* Lines */}
        <div className="space-y-1.5 flex-1 pt-2">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1 rounded-full w-full ${isDark ? 'bg-slate-700/40' : 'bg-slate-50'}`}></div>
            ))}
            <div className={`h-1 rounded-full w-2/3 ${isDark ? 'bg-slate-700/40' : 'bg-slate-50'}`}></div>
        </div>
        {/* Signature Line */}
        <div className={`mt-auto pt-2 flex items-center justify-between border-t ${isDark ? 'border-slate-700' : 'border-slate-50'}`}>
            <div className={`h-1 rounded-full w-1/3 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
            <div className="h-1.5 bg-blue-500/40 rounded-full w-5/12"></div>
        </div>
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
    </div>
);

export const TemplateList: React.FC<TemplateListProps> = ({
    templates,
    onSelect,
    onCreate,
    onRename,
    onDelete,
    onBulkDelete,
    onViewDocuments,
    onDuplicate
}) => {
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [renamingTemplateId, setRenamingTemplateId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const startRenaming = (e: React.MouseEvent, id: string, currentName: string) => {
        e.stopPropagation();
        setRenamingTemplateId(id);
        setRenameValue(currentName);
        setActiveMenuId(null);
    };

    const submitRename = (id: string) => {
        if (renameValue.trim()) onRename(id, renameValue);
        setRenamingTemplateId(null);
    };

    const toggleSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const selectAll = () => {
        if (templates && selectedIds.size === templates.length) {
            setSelectedIds(new Set()); // Deselect all
        } else if (templates) {
            setSelectedIds(new Set(templates.map(t => t.id))); // Select all
        }
    };

    const handleBulkDelete = () => {
        if (onBulkDelete && selectedIds.size > 0) {
            // Confirm before bulk delete
            if (window.confirm(`Are you sure you want to delete ${selectedIds.size} templates?`)) {
                onBulkDelete(Array.from(selectedIds));
                setSelectedIds(new Set()); // Clear selection after delete
            }
        }
    };

    const isSelectionMode = selectedIds.size > 0;

    const isDark = useAppStore(state => state.theme === 'dark');

    return (
        <div className={`w-full h-full flex flex-col relative transition-colors duration-300 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 shrink-0 pt-2">
                <div>
                    <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>E-Sign Templates</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and select consent templates for your patients</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full md:w-auto group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input type="text" placeholder="Search templates..." className={`w-full md:w-80 pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900'
                            }`} />
                    </div>
                    <button
                        onClick={onCreate}
                        className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 ${isDark ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' : 'bg-slate-950 hover:bg-slate-900 text-white shadow-black/10'
                            }`}
                    >
                        <Plus className="w-5 h-5" /> Create Template
                    </button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {isSelectionMode && (
                <div className={`border rounded-xl p-3 mb-6 flex items-center justify-between shrink-0 animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-blue-950/30 border-blue-900/50 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={selectAll}
                            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'text-blue-300 hover:text-blue-200 bg-blue-900/30 hover:bg-blue-900/50' : 'text-blue-700 hover:text-blue-900 bg-blue-100/50 hover:bg-blue-200/50'
                                }`}
                        >
                            {selectedIds.size === templates?.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <span className={`text-sm font-medium px-2.5 py-1 rounded-md ${isDark ? 'text-blue-200 bg-blue-900/20' : 'text-blue-800 bg-white/50'
                            }`}>
                            {selectedIds.size} selected
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-1.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Selected
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4 scrollbar-hide">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 py-2 pb-12">
                    {templates?.map(t => (
                        <div
                            key={t.id}
                            className={`group rounded-[2rem] border transition-all duration-500 flex flex-col h-full relative cursor-pointer ${selectedIds.has(t.id)
                                ? (isDark ? 'border-emerald-500 ring-4 ring-emerald-500/10 bg-slate-900 shadow-2xl' : 'border-emerald-500 ring-4 ring-emerald-500/10 bg-white shadow-xl')
                                : (isDark ? 'bg-slate-900/40 border-slate-800/50 hover:border-blue-500/50 hover:bg-slate-900 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]')
                                }`}
                            onClick={() => {
                                if (isSelectionMode) {
                                    const newSelected = new Set(selectedIds);
                                    if (newSelected.has(t.id)) newSelected.delete(t.id);
                                    else newSelected.add(t.id);
                                    setSelectedIds(newSelected);
                                    return;
                                }
                                if (!activeMenuId && renamingTemplateId !== t.id) {
                                    onSelect(t.url, t.name, t.id, t.fields);
                                }
                            }}
                        >
                            {/* Checkbox for selection */}
                            <div className="absolute top-3 left-3 z-10">
                                <button
                                    onClick={(e) => toggleSelection(e, t.id)}
                                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors border shadow-sm ${selectedIds.has(t.id) ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 text-transparent hover:border-blue-400 group-hover:border-slate-400'}`}
                                >
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Preview Area */}
                            <div className={`h-44 flex items-center justify-center relative overflow-hidden rounded-t-[2rem] ${isDark ? 'bg-slate-950/40' : 'bg-slate-50/40'
                                }`}>
                                <div className={`absolute inset-0 [background-size:20px_20px] opacity-[0.03] ${isDark ? 'bg-[radial-gradient(white_1px,transparent_1px)]' : 'bg-[radial-gradient(black_1px,transparent_1px)]'
                                    }`}></div>
                                <div className="relative transform transition-all duration-700 group-hover:scale-110 group-hover:rotate-2">
                                    <DocumentPreviewIcon isDark={isDark} />
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className={`p-6 flex flex-col flex-1 relative rounded-b-[2rem] ${isDark ? 'bg-slate-900/20' : 'bg-white'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 min-w-0 pr-2">
                                        {renamingTemplateId === t.id ? (
                                            <div className="flex items-center gap-1 mb-1" onClick={e => e.stopPropagation()}>
                                                <input autoFocus type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className={`w-full text-sm font-bold border rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isDark ? 'bg-slate-800 border-blue-500 text-white' : 'bg-white border-blue-400 text-slate-900'
                                                    }`} />
                                                <button onClick={() => submitRename(t.id)} className={`p-1 rounded transition-colors ${isDark ? 'text-green-400 hover:bg-green-900/30' : 'text-green-600 hover:bg-green-50'
                                                    }`}><Check className="w-3 h-3" /></button>
                                            </div>
                                        ) : (
                                            <h3 className={`font-bold text-sm leading-tight transition-colors mb-1.5 ${isDark ? 'text-slate-100 group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
                                                }`} title={t.name}>{t.name}</h3>
                                        )}
                                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                            <Clock className="w-3 x-3 opacity-50" />
                                            {t.created_at
                                                ? formatDisplayDate(t.created_at)
                                                : 'Recently'}
                                        </p>
                                    </div>
                                    <div className="relative" ref={activeMenuId === t.id ? menuRef : null}>
                                        <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === t.id ? null : t.id); }} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                                            }`}>
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                        {activeMenuId === t.id && (
                                            <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl border py-2 z-[100] animate-in zoom-in-95 duration-100 origin-top-right ${isDark ? 'bg-slate-900 border-slate-700 shadow-black/60' : 'bg-white border-slate-100 shadow-slate-200/50'
                                                }`}>
                                                <button onClick={(e) => startRenaming(e, t.id, t.name)} className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 font-semibold transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-blue-400' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                                    }`}>
                                                    <Edit2 className="w-3.5 h-3.5" /> Rename Template
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenuId(null);
                                                        if (onDuplicate) onDuplicate(t.id);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 font-semibold transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-blue-400' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                                        }`}
                                                >
                                                    <FileText className="w-3.5 h-3.5" /> Duplicate Template
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenuId(null);
                                                        if (onViewDocuments) onViewDocuments(t.name);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 font-semibold transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-blue-400' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                                        }`}
                                                >
                                                    <FileText className="w-3.5 h-3.5" /> View Documents
                                                </button>
                                                <div className={`my-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-50'}`}></div>
                                                <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 font-semibold transition-colors ${isDark ? 'text-red-400 hover:bg-red-950/30' : 'text-red-600 hover:bg-red-50'
                                                    }`}>
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete Template
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={`mt-auto pt-4 flex items-center justify-between border-t transition-colors ${isDark ? 'border-slate-800' : 'border-slate-50'
                                    }`}>
                                    {t.category ? (
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
                                            }`}>{t.category}</span>
                                    ) : (
                                        <span></span>
                                    )}
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md tracking-wider uppercase ${isDark ? 'text-slate-500 bg-slate-800/50' : 'text-slate-400 bg-slate-50'
                                        }`}>v1.0</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Placeholder Card */}
                    <div
                        onClick={onCreate}
                        className={`group border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center gap-6 transition-all duration-500 cursor-pointer min-h-[320px] ${isDark
                            ? 'border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/10'
                            : 'border-slate-200 hover:border-blue-400/50 hover:bg-blue-50/30 hover:shadow-2xl hover:shadow-blue-500/5'
                            }`}
                    >
                        <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100 group-hover:bg-white group-hover:shadow-xl'
                            }`}>
                            <Plus className={`w-10 h-10 transition-colors ${isDark ? 'text-slate-600 group-hover:text-blue-400' : 'text-slate-300 group-hover:text-blue-500'
                                }`} />
                        </div>
                        <div className="text-center">
                            <p className={`font-bold text-lg tracking-tight transition-colors ${isDark ? 'text-slate-300 group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'}`}>New Template</p>
                            <p className="text-xs text-slate-500 mt-2 max-w-[180px] font-bold uppercase tracking-wider leading-relaxed opacity-60">Upload PDF to start</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
