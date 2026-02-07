import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useSaveTemplate, useSendToPatient } from '../hooks/useAppQueries';
import { CanvasArea } from './doctor/CanvasArea';
import { EditorHeader } from './doctor/EditorHeader';
import { EditorSidebar } from './doctor/EditorSidebar';
import { SmartField, AppStep } from '../types';
import { SendConfirmationModal } from './doctor/SendConfirmationModal';
import { toast } from 'sonner';

export const DoctorEditor: React.FC = () => {
    const navigate = useNavigate();
    const {
        consentForm, patientDetails, updateConsentForm,
        setStep, addField, updateField, removeField,
        setActiveFieldId
    } = useAppStore();

    const { mutate: sendToPatient, isPending: isSending } = useSendToPatient();
    const { mutate: saveTemplate, isPending: isSavingTemplate } = useSaveTemplate();

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
    const [showSendModal, setShowSendModal] = useState(false);

    // Redirect if no document loaded
    useEffect(() => {
        if (!consentForm.fileUrl) {
            navigate('/doctor/dashboard');
        }
    }, [consentForm.fileUrl, navigate]);

    // Field Manipulation Handlers
    const handleAddField = (type: 'TEXT' | 'DATE' | 'SIGNATURE' | 'TITLE') => {
        const id = Math.random().toString(36).substr(2, 9);
        let newField: SmartField;

        if (type === 'TITLE') {
            newField = {
                id: 'title-field-' + id,
                type: 'TEXT',
                label: 'Header Title',
                x: 5, y: 5, w: 90, h: 6,
                value: consentForm.procedureName.toUpperCase() || 'DOCUMENT TITLE',
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center'
            };
        } else {
            newField = {
                id,
                type,
                label: type === 'SIGNATURE' ? 'Sign Here' : type === 'DATE' ? 'Date' : 'Text Field',
                x: type === 'DATE' ? 75 : 35,
                y: type === 'DATE' ? 19.5 : 45,
                w: type === 'DATE' ? 15 : (type === 'SIGNATURE' ? 30 : 25),
                h: type === 'DATE' ? 2.5 : (type === 'SIGNATURE' ? 5 : 3),
                value: type === 'DATE' ? new Date().toLocaleDateString() : (type === 'TEXT' ? patientDetails.fullName : ''),
                fontSize: type === 'SIGNATURE' ? undefined : 14,
                fontWeight: 'normal',
                textAlign: 'left'
            };
        }

        addField(newField);
        setSelectedIds(new Set([newField.id]));
        setActiveFieldId(newField.id);
        if (type !== 'SIGNATURE') setEditingFieldId(newField.id);
    };

    const changeFontSize = (delta: number) => {
        selectedIds.forEach(id => {
            const field = consentForm.fields?.find(f => f.id === id);
            if (field && (field.type === 'TEXT' || field.type === 'DATE')) {
                const currentSize = field.fontSize || 14;
                updateField(id, { fontSize: Math.max(8, Math.min(72, currentSize + delta)) });
            }
        });
    };

    const toggleBold = () => {
        selectedIds.forEach(id => {
            const field = consentForm.fields?.find(f => f.id === id);
            if (field && (field.type === 'TEXT' || field.type === 'DATE')) {
                updateField(id, { fontWeight: field.fontWeight === 'bold' ? 'normal' : 'bold' });
            }
        });
    };

    const setTextAlign = (align: 'left' | 'center' | 'right') => {
        selectedIds.forEach(id => {
            const field = consentForm.fields?.find(f => f.id === id);
            if (field && (field.type === 'TEXT' || field.type === 'DATE')) updateField(id, { textAlign: align });
        });
    };

    const validateForm = () => {
        const errors = new Set<string>();
        consentForm.fields?.forEach(field => {
            if (field.type === 'TEXT' && (!field.value || field.value.trim() === '')) errors.add(field.id);
            else if (field.type === 'DATE' && (!field.value || isNaN(Date.parse(field.value)))) errors.add(field.id);
        });
        setValidationErrors(errors);
        return errors.size === 0;
    };

    const handleSendClick = () => {
        if (!validateForm()) return;
        setShowSendModal(true);
    };

    const confirmSend = () => {
        sendToPatient(
            { patient: patientDetails, form: consentForm },
            {
                onSuccess: () => {
                    setShowSendModal(false);
                    toast.success('Document sent to patient via WhatsApp!');
                    navigate('/doctor/dashboard');
                },
                onError: () => {
                    setShowSendModal(false);
                    toast.error('Failed to send document. Please try again.');
                }
            }
        );
    };

    const handleSaveAsTemplate = () => {
        if (!consentForm.procedureName || !consentForm.fileUrl) {
            toast.error("Please ensure the document has a title and file.");
            return;
        }
        saveTemplate({ name: consentForm.procedureName, file_url: consentForm.fileUrl }, {
            onSuccess: () => toast.success('Template saved successfully!')
        });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden p-4 md:p-6 bg-slate-50 relative">
            <EditorHeader
                procedureName={consentForm.procedureName}
                onProcedureNameChange={(val) => updateConsentForm({ procedureName: val })}
                onBack={() => navigate('/doctor/dashboard')}
                onSaveTemplate={handleSaveAsTemplate}
                isSavingTemplate={isSavingTemplate}
                onSend={handleSendClick}
                isSending={isSending}
                canSend={!!(patientDetails.fullName && consentForm.fields?.length)}
            />

            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
                <EditorSidebar
                    selectedIds={selectedIds}
                    onClearSelection={() => setSelectedIds(new Set())}
                    onAddField={handleAddField}
                    onChangeFontSize={changeFontSize}
                    onToggleBold={toggleBold}
                    onSetTextAlign={setTextAlign}
                    onDeleteSelected={() => { selectedIds.forEach(id => removeField(id)); setSelectedIds(new Set()); }}
                />

                <CanvasArea
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    editingFieldId={editingFieldId}
                    setEditingFieldId={setEditingFieldId}
                    validationErrors={validationErrors}
                    onClearValidationError={(id) => {
                        const newErrors = new Set(validationErrors);
                        newErrors.delete(id);
                        setValidationErrors(newErrors);
                    }}
                    isProcessingPdf={false} // Since we load before navigating
                />
            </div>

            <SendConfirmationModal
                isOpen={showSendModal}
                onClose={() => setShowSendModal(false)}
                onConfirm={confirmSend}
                patientDetails={patientDetails}
                form={consentForm}
                isSending={isSending}
            />
        </div>
    );
};
