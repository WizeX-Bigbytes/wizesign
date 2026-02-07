import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { X, FileText, UploadCloud, Loader2, Plus } from 'lucide-react';

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
    const [newTemplateName, setNewTemplateName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const modalFileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === 'application/pdf') {
                setSelectedFile(file);
                // Auto-fill name if empty
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">Create New Template</h2>
                    <button
                        onClick={() => { onClose(); setSelectedFile(null); setNewTemplateName(''); }}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Template Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Cataract Surgery Consent"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-900"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Upload Document (PDF)</label>
                        <div
                            onClick={() => modalFileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${selectedFile ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
                        >
                            <input
                                ref={modalFileInputRef}
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={handleModalFileChange}
                            />
                            {selectedFile ? (
                                <>
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <p className="font-bold text-slate-900 text-sm text-center break-all">{selectedFile.name}</p>
                                    <p className="text-xs text-blue-600 mt-1 font-medium">Click to change</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                                        <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                    <p className="font-bold text-slate-900 text-sm">Click to upload PDF</p>
                                    <p className="text-xs text-slate-500 mt-1">Maximum size 10MB</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={() => { onClose(); setSelectedFile(null); setNewTemplateName(''); }}
                        className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!selectedFile || isProcessing}
                        className="flex-1 py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {isProcessing ? 'Processing...' : 'Create & Edit'}
                    </button>
                </div>
            </div>
        </div>
    );
}
