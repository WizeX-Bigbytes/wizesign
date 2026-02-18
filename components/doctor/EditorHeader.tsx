import React, { useState } from 'react';
import { ArrowLeft, Edit2, Save, Send, Loader2 } from 'lucide-react';

interface EditorHeaderProps {
    procedureName: string;
    onProcedureNameChange: (val: string) => void;
    onBack: () => void;
    onSaveTemplate: () => void;
    isSavingTemplate: boolean;
    onSend: () => void;
    isSending: boolean;
    canSend: boolean;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
    procedureName,
    onProcedureNameChange,
    onBack,
    onSaveTemplate,
    isSavingTemplate,
    onSend,
    isSending,
    canSend
}) => {
    return (
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 shrink-0 px-1">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="hidden sm:inline font-medium text-sm">Back</span>
                </button>
                <div className="group relative flex-1">
                    <input
                        value={procedureName}
                        onChange={(e) => onProcedureNameChange(e.target.value)}
                        className="text-lg md:text-xl font-bold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-0.5 -ml-2 transition-all outline-none placeholder-slate-300 w-full md:w-96 truncate"
                        placeholder="Untitled Document"
                    />
                    <Edit2 className="w-3.5 h-3.5 text-slate-300 absolute right-0 md:-right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto">
                <button onClick={onSaveTemplate} disabled={isSavingTemplate} className="px-3 py-2 text-xs md:text-sm font-bold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 rounded-xl transition-all shadow-sm flex items-center gap-2">
                    {isSavingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span className="hidden sm:inline">Save Template</span>
                </button>
                <button onClick={onSend} disabled={!canSend || isSending} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs md:text-sm md:px-6 md:py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSending ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
                    Send
                </button>
            </div>
        </div>
    );
};
