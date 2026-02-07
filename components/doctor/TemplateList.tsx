import React, { useState, useRef, useEffect } from 'react';
import {
    FileText, Plus, Search, MoreHorizontal, Clock, Edit2, Trash2, Check
} from 'lucide-react';

interface Template {
    id: string;
    name: string;
    url: string;
    updatedAt?: string;
}

interface TemplateListProps {
    templates: Template[] | undefined;
    onSelect: (url: string, name: string) => void;
    onCreate: () => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
}

const DocumentPreviewIcon = () => (
    <div className="relative w-28 h-36 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200 p-3 flex flex-col gap-2 transform transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
        {/* Decorative Header */}
        <div className="flex gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-blue-500 opacity-50" />
            </div>
            <div className="flex-1 space-y-1 py-1">
                <div className="h-1.5 bg-slate-100 rounded-full w-3/4"></div>
                <div className="h-1.5 bg-slate-100 rounded-full w-1/2"></div>
            </div>
        </div>
        {/* Lines */}
        <div className="space-y-1.5 flex-1">
            <div className="h-1 bg-slate-50 rounded-full w-full"></div>
            <div className="h-1 bg-slate-50 rounded-full w-full"></div>
            <div className="h-1 bg-slate-50 rounded-full w-5/6"></div>
            <div className="h-1 bg-slate-50 rounded-full w-full"></div>
        </div>
        {/* Signature Line */}
        <div className="mt-auto pt-2 border-t border-slate-50">
            <div className="h-1 bg-blue-50 rounded-full w-1/2 ml-auto"></div>
        </div>
        {/* Badge */}
        <div className="absolute -right-1 -top-1 w-3 h-3 bg-red-400 rounded-full border-2 border-white"></div>
    </div>
);

export const TemplateList: React.FC<TemplateListProps> = ({
    templates,
    onSelect,
    onCreate,
    onRename,
    onDelete
}) => {
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [renamingTemplateId, setRenamingTemplateId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
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

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col relative px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 shrink-0 pt-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">E-Sign Templates</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and select consent templates for your patients</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full md:w-auto group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input type="text" placeholder="Search templates..." className="w-full md:w-64 pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm transition-all" />
                    </div>
                    <button
                        onClick={onCreate}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-slate-900/10 active:translate-y-0.5 active:shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Create New
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pb-6 -mx-4 px-4 scroll-smooth">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {templates?.map(t => (
                        <div
                            key={t.id}
                            className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden h-full relative cursor-pointer ring-0 hover:ring-2 ring-blue-500/10"
                            onClick={() => { if (!activeMenuId && renamingTemplateId !== t.id) onSelect(t.url, t.name); }}
                        >
                            {/* Preview Area */}
                            <div className="h-48 bg-slate-50/50 border-b border-slate-100 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
                                <DocumentPreviewIcon />
                            </div>

                            {/* Content Area */}
                            <div className="p-5 flex flex-col flex-1 relative bg-white">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 min-w-0 pr-2">
                                        {renamingTemplateId === t.id ? (
                                            <div className="flex items-center gap-1 mb-1" onClick={e => e.stopPropagation()}>
                                                <input autoFocus type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="w-full text-sm font-bold text-slate-900 border border-blue-400 rounded px-1.5 py-0.5" />
                                                <button onClick={() => submitRename(t.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-3 h-3" /></button>
                                            </div>
                                        ) : (
                                            <h3 className="font-bold text-slate-900 text-base leading-tight truncate group-hover:text-blue-600 transition-colors" title={t.name}>{t.name}</h3>
                                        )}
                                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Updated 2d ago
                                        </p>
                                    </div>
                                    <div className="relative" ref={activeMenuId === t.id ? menuRef : null}>
                                        <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === t.id ? null : t.id); }} className="text-slate-300 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                        {activeMenuId === t.id && (
                                            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in zoom-in-95 duration-100 origin-top-right">
                                                <button onClick={(e) => startRenaming(e, t.id, t.name)} className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 font-medium">
                                                    <Edit2 className="w-3.5 h-3.5" /> Rename
                                                </button>
                                                <div className="my-1 border-b border-slate-50"></div>
                                                <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium">
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-50">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">Surgical</span>
                                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">v1.0</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Placeholder Card */}
                    <div
                        onClick={onCreate}
                        className="group border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer min-h-[300px]"
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-50 group-hover:bg-white group-hover:shadow-md border border-slate-100 flex items-center justify-center transition-all">
                            <Plus className="w-8 h-8 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Create Template</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-[150px]">Upload a PDF to start a new workflow</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
