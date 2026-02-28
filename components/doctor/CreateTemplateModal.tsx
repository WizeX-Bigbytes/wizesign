import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { X, FileText, UploadCloud, Loader2, Plus, Zap } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface CreateTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, file: File) => void;
    isProcessing: boolean;
}

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isProcessing
}) => {
    const isDark = useAppStore(state => state.theme === 'dark');
    const [newTemplateName, setNewTemplateName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const modalFileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === 'application/pdf') {
                setSelectedFile(file);
                if (!newTemplateName) {
                    setNewTemplateName(file.name.replace('.pdf', '').replace(/_/g, ' '));
                }
            } else {
                toast.error("Please upload a valid PDF file.");
            }
        }
    };

    const handleCreate = () => {
        if (selectedFile) {
            onSubmit(newTemplateName, selectedFile);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className={`absolute inset-0 backdrop-blur-md transition-colors ${isDark ? 'bg-slate-950/80' : 'bg-slate-900/40'}`} onClick={onClose}></div>

            <div className={`relative w-full max-w-lg rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}>
                <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-50 bg-slate-50/50'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-blue-600/10 text-blue-400' : 'bg-blue-100/50 text-blue-600'}`}>
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Create New Template</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Start a new workflow</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { onClose(); setSelectedFile(null); setNewTemplateName(''); }}
                        className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-800 text-slate-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    <div className="group">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Template Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Cataract Surgery Consent"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            className={`w-full px-6 py-4 rounded-2xl border text-sm font-bold transition-all focus:outline-none focus:ring-4 ${isDark
                                    ? 'bg-slate-950/40 border-slate-800 text-white focus:border-blue-500/50 focus:ring-blue-500/10 placeholder:text-slate-700'
                                    : 'bg-slate-50/50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/5 placeholder:text-slate-400'
                                }`}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Upload Document (PDF)</label>
                        <div
                            onClick={() => modalFileInputRef.current?.click()}
                            className={`group border-2 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ${selectedFile
                                    ? (isDark ? 'border-blue-500/50 bg-blue-500/5' : 'border-blue-500 bg-blue-50/30')
                                    : (isDark ? 'border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50 shadow-sm')
                                }`}
                        >
                            <input
                                ref={modalFileInputRef}
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={handleModalFileChange}
                            />
                            {selectedFile ? (
                                <div className="text-center">
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:rotate-6 ${isDark ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'}`}>
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <p className={`font-bold text-sm max-w-[240px] truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedFile.name}</p>
                                    <p className="text-xs text-blue-500 mt-2 font-bold uppercase tracking-wider opacity-80">Click to change file</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 ${isDark ? 'bg-slate-950 border border-slate-800 text-slate-400' : 'bg-white border border-slate-100 text-slate-300 shadow-md group-hover:shadow-xl'}`}>
                                        <UploadCloud className="w-8 h-8" />
                                    </div>
                                    <p className={`font-bold text-sm mb-1 ${isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-900'}`}>Click to upload PDF</p>
                                    <p className="text-xs text-slate-500 font-medium">Maximum size 10MB</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`p-8 flex gap-4 ${isDark ? 'bg-slate-900/50 border-t border-slate-800' : 'bg-slate-50/50 border-t border-slate-50'}`}>
                    <button
                        onClick={() => { onClose(); setSelectedFile(null); setNewTemplateName(''); }}
                        className={`flex-1 py-4 px-6 font-bold rounded-2xl transition-all border ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!selectedFile || isProcessing}
                        className={`flex-1 py-4 px-6 font-bold rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 ${isDark ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40' : 'bg-slate-950 hover:bg-slate-900 text-white shadow-black/20'
                            }`}
                    >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        {isProcessing ? 'Processing...' : 'Create & Edit'}
                    </button>
                </div>
            </div>
        </div>
    );
};
