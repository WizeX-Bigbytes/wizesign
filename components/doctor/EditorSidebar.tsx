import React from 'react';
import {
    FileText, Minus, Plus, Bold,
    AlignLeft, AlignCenter, AlignRight, Trash2,
    User, Type, Calendar, PenTool
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface EditorSidebarProps {
    selectedIds: Set<string>;
    onClearSelection: () => void;
    onAddField: (type: 'TEXT' | 'DATE' | 'SIGNATURE' | 'TITLE') => void;
    onChangeFontSize: (delta: number) => void;
    onToggleBold: () => void;
    onSetTextAlign: (align: 'left' | 'center' | 'right') => void;
    onDeleteSelected: () => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
    selectedIds,
    onClearSelection,
    onAddField,
    onChangeFontSize,
    onToggleBold,
    onSetTextAlign,
    onDeleteSelected
}) => {
    const {
        consentForm, patientDetails, updatePatientDetails,
        updateConsentForm, updateField
    } = useAppStore();

    const getCommonFontSize = () => {
        if (selectedIds.size === 0) return 14;
        const firstId = Array.from(selectedIds)[0];
        const field = consentForm.fields?.find(f => f.id === firstId);
        return field?.fontSize || 14;
    };

    return (
        <div className="w-full lg:w-80 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col shrink-0 order-2 lg:order-1 max-h-[35vh] lg:max-h-full">
            <div className="p-3 md:p-5 border-b border-slate-100 flex justify-between lg:block cursor-pointer lg:cursor-default bg-slate-50 lg:bg-white">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm md:text-base">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Configuration
                </h3>
                <span className="lg:hidden text-xs text-slate-400 font-medium">Scroll to edit</span>
            </div>
            <div className="p-3 md:p-5 flex-1 overflow-y-auto space-y-4 md:space-y-6">
                {selectedIds.size > 0 ? (
                    <div className="bg-slate-50 p-3 rounded-xl border border-blue-100">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] font-bold text-blue-900 uppercase flex items-center gap-1">Selected</label>
                            <span className="text-[10px] bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-bold">{selectedIds.size}</span>
                        </div>

                        {selectedIds.size === 1 && (
                            (() => {
                                const id = Array.from(selectedIds)[0];
                                const field = consentForm.fields?.find(f => f.id === id);
                                if (!field) return null;
                                return (
                                    <div className="space-y-2 mb-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Label</label>
                                            <input type="text" value={field.label} onChange={(e) => updateField(id, { label: e.target.value })} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        {(field.type === 'TEXT' || field.type === 'DATE') && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Value</label>
                                                <input type="text" value={field.value || ''} onChange={(e) => updateField(id, { value: e.target.value })} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })()
                        )}

                        {/* Font & Style */}
                        <div className="flex gap-2 mb-3">
                            <div className="flex items-center gap-1 bg-white p-1 rounded border border-slate-200">
                                <button onClick={() => onChangeFontSize(-1)} className="p-1 hover:bg-slate-50"><Minus className="w-3 h-3" /></button>
                                <span className="text-xs font-bold w-6 text-center">{getCommonFontSize()}</span>
                                <button onClick={() => onChangeFontSize(1)} className="p-1 hover:bg-slate-50"><Plus className="w-3 h-3" /></button>
                            </div>
                            <button onClick={onToggleBold} className="bg-white p-1.5 rounded border border-slate-200 hover:bg-slate-50"><Bold className="w-3.5 h-3.5" /></button>
                            <div className="flex bg-white rounded border border-slate-200 p-0.5 ml-auto">
                                <button onClick={() => onSetTextAlign('left')} className="p-1 hover:bg-slate-50"><AlignLeft className="w-3.5 h-3.5" /></button>
                                <button onClick={() => onSetTextAlign('center')} className="p-1 hover:bg-slate-50"><AlignCenter className="w-3.5 h-3.5" /></button>
                                <button onClick={() => onSetTextAlign('right')} className="p-1 hover:bg-slate-50"><AlignRight className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>

                        <button onClick={onDeleteSelected} className="w-full flex items-center justify-center gap-2 text-red-600 bg-white border border-red-100 hover:bg-red-50 p-2 rounded-lg text-xs font-bold shadow-sm">
                            <Trash2 className="w-3 h-3" /> Delete
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <label className="block text-[10px] font-bold text-blue-900 uppercase mb-2 flex items-center gap-1"><User className="w-3 h-3" /> Patient</label>
                            <input type="text" placeholder="Full Name" value={patientDetails.fullName} onChange={(e) => updatePatientDetails({ fullName: e.target.value })} className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none mb-2" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Metadata</label>
                            <div className="space-y-2">
                                <input type="text" placeholder="Doctor Name" value={consentForm.doctorName} onChange={(e) => updateConsentForm({ doctorName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                                <input type="text" placeholder="Clinic Name" value={consentForm.clinicName} onChange={(e) => updateConsentForm({ clinicName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="border-t border-slate-100 pt-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Fields</label>
                    <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
                        <button onClick={() => onAddField('TITLE')} className="flex flex-col items-center justify-center p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm"><Type className="w-4 h-4 mb-1 text-slate-400" /><span className="text-[9px] font-bold">Title</span></button>
                        <button onClick={() => onAddField('TEXT')} className="flex flex-col items-center justify-center p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm"><Type className="w-4 h-4 mb-1 text-slate-400" /><span className="text-[9px] font-bold">Text</span></button>
                        <button onClick={() => onAddField('DATE')} className="flex flex-col items-center justify-center p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm"><Calendar className="w-4 h-4 mb-1 text-slate-400" /><span className="text-[9px] font-bold">Date</span></button>
                        <button onClick={() => onAddField('SIGNATURE')} className="flex flex-col items-center justify-center p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-sm text-blue-700"><PenTool className="w-4 h-4 mb-1" /><span className="text-[9px] font-bold">Sign</span></button>
                    </div>
                </div>
            </div>
        </div>
    );
};
