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
    onAddField: (type: string, config?: { label?: string, value?: string }) => void;
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
        <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col shrink-0 order-2 lg:order-1 max-h-[80vh] lg:max-h-full overflow-hidden">
            {/* Context Section (Always Visible) */}
            <div className="flex-none p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="w-3 h-3" /> Data Source
                </h3>
                <div className="space-y-3">
                    {/* Patient Context */}
                    <div className="space-y-2">
                        <input 
                            type="text" 
                            placeholder="Full Name" 
                            value={patientDetails.fullName} 
                            onChange={(e) => updatePatientDetails({ fullName: e.target.value })} 
                            disabled={!!patientDetails.id}
                            className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none ${patientDetails.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input 
                                type="tel" 
                                placeholder="Phone" 
                                value={patientDetails.phone || ''} 
                                onChange={(e) => updatePatientDetails({ phone: e.target.value })} 
                                disabled={!!patientDetails.id}
                                className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none ${patientDetails.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                            />
                            <input 
                                type="text" 
                                placeholder="Doctor Name" 
                                value={consentForm.doctorName} 
                                onChange={(e) => updateConsentForm({ doctorName: e.target.value })} 
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Area (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 content-start">
                
                {/* MODE A: Field Properties (Active Selection) */}
                {selectedIds.size > 0 ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-blue-900 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>
                                Edit Properties
                            </h3>
                            <button onClick={onClearSelection} className="text-[10px] text-slate-400 hover:text-slate-600 underline">Close</button>
                        </div>
                        
                        <div className="bg-slate-50 p-3 rounded-xl border border-blue-100 mb-4">
                            {selectedIds.size === 1 && (
                                (() => {
                                    const id = Array.from(selectedIds)[0];
                                    const field = consentForm.fields?.find(f => f.id === id);
                                    if (!field) return null;
                                    return (
                                        <div className="space-y-3 mb-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Label</label>
                                                <input type="text" value={field.label} onChange={(e) => updateField(id, { label: e.target.value })} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                                            </div>
                                            {(field.type === 'TEXT' || field.type === 'DATE') && (
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                        Value {field.source && <span className="text-[8px] text-blue-500 bg-blue-50 px-1 rounded ml-1">LINKED</span>}
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        value={field.value || ''} 
                                                        onChange={(e) => updateField(id, { value: e.target.value })} 
                                                        className={`w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none ${field.source ? 'border-l-2 border-l-blue-400' : ''}`} 
                                                    />
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
                        </div>
                        
                        <button onClick={onDeleteSelected} className="w-full flex items-center justify-center gap-2 text-red-600 bg-white border border-red-100 hover:bg-red-50 p-2 rounded-lg text-xs font-bold shadow-sm">
                            <Trash2 className="w-3 h-3" /> Delete Selected
                        </button>
                    </div>

                ) : (
                    /* MODE B: Tools Palette (No Selection) */
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                            <PenTool className="w-3 h-3" /> Toolbox
                        </label>

                        {/* Smart Fields Group */}
                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 mb-4">
                            <span className="text-[9px] font-bold text-slate-400 uppercase mb-2 block tracking-wider">Smart Data Fields</span>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => onAddField('TEXT', { label: 'Patient Name', value: patientDetails.fullName, source: 'patient.fullName' })} 
                                    className="flex items-center gap-2 p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg shadow-sm text-left transition-colors group"
                                >
                                    <User className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-700">Patient Name</span>
                                </button>
                                <button 
                                    onClick={() => onAddField('TEXT', { label: 'Phone Number', value: patientDetails.phone, source: 'patient.phone' })} 
                                    className="flex items-center gap-2 p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg shadow-sm text-left transition-colors group"
                                >
                                    <span className="w-3 h-3 flex items-center justify-center text-[8px] font-bold bg-slate-100 text-slate-500 rounded group-hover:bg-blue-100 group-hover:text-blue-600">#</span>
                                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-700">Phone</span>
                                </button>
                                <button 
                                    onClick={() => onAddField('TEXT', { label: 'Doctor Name', value: consentForm.doctorName, source: 'doctor.name' })} 
                                    className="flex items-center gap-2 p-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg shadow-sm text-left transition-colors group"
                                >
                                    <User className="w-3 h-3 text-slate-400 group-hover:text-emerald-500" />
                                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-emerald-700">Doctor Name</span>
                                </button>
                                <button 
                                    onClick={() => onAddField('DATE', { label: 'Today\'s Date', source: 'meta.date' })} 
                                    className="flex items-center gap-2 p-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg shadow-sm text-left transition-colors group"
                                >
                                    <Calendar className="w-3 h-3 text-slate-400 group-hover:text-emerald-500" />
                                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-emerald-700">Current Date</span>
                                </button>
                            </div>
                        </div>

                        {/* Basic Tools Group */}
                         <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-400 uppercase mb-2 block tracking-wider">Basic Elements</span>
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={() => onAddField('TEXT', { label: 'Text Box' })} className="flex flex-col items-center justify-center p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95"><Type className="w-4 h-4 mb-1 text-slate-400" /><span className="text-[9px] font-bold text-slate-600">Text</span></button>
                                <button onClick={() => onAddField('TITLE')} className="flex flex-col items-center justify-center p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95"><Type className="w-4 h-4 mb-1 text-slate-800" /><span className="text-[9px] font-bold text-slate-600">Header</span></button>
                                <button onClick={() => onAddField('SIGNATURE')} className="col-span-2 flex flex-row items-center justify-center gap-2 p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg shadow-sm text-amber-700 transition-all hover:scale-105 active:scale-95"><PenTool className="w-4 h-4" /><span className="text-[9px] font-bold">Signature Box</span></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
