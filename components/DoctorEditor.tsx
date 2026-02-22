import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useSaveTemplate, useSendToPatient } from '../hooks/useAppQueries';
import { api } from '../services/api';
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
    const [patientLink, setPatientLink] = useState<string>('');
    const [documentId, setDocumentId] = useState<string>('');

    // Redirect if no document loaded
    useEffect(() => {
        if (!consentForm.fileUrl) {
            navigate('/doctor/dashboard');
        }
    }, [consentForm.fileUrl, navigate]);

    // Field Manipulation Handlers
    const handleAddField = (type: string, config?: { label?: string, value?: string, source?: string }) => {
        const id = Math.random().toString(36).substr(2, 9);
        let newField: SmartField;

        const baseField = {
            id,
            type: (type === 'TITLE' || type === 'DATE' || type === 'SIGNATURE') ? type : 'TEXT', // Map custom types to TEXT underlying type
            x: 35, y: 45, w: 25, h: 3,
            fontSize: 14,
            fontWeight: 'normal',
            textAlign: 'left' as const,
            source: config?.source
        };

        if (type === 'TITLE') {
            newField = {
                ...baseField,
                id: 'title-field-' + id,
                type: 'TEXT',
                label: 'Header Title',
                x: 5, y: 5, w: 90, h: 6,
                value: consentForm.procedureName.toUpperCase() || 'DOCUMENT TITLE',
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center'
            };
        } else if (type === 'SIGNATURE') {
            newField = {
                ...baseField,
                type: 'SIGNATURE',
                label: 'Sign Here',
                w: 30, h: 5,
                value: '',
                fontSize: undefined
            };
        } else if (type === 'DATE') {
            newField = {
                ...baseField,
                type: 'DATE',
                label: 'Date',
                x: 75, y: 19.5, w: 15, h: 2.5,
                value: new Date().toLocaleDateString()
            };
        } else {
            // Generic or Smart Text Fields
            newField = {
                ...baseField,
                type: 'TEXT',
                label: config?.label || 'Text Field',
                value: config?.value || '', // Use provided value or empty (no placeholder)
            };
        }

        addField(newField);
        setSelectedIds(new Set([newField.id]));
        setActiveFieldId(newField.id);
        if (newField.type !== 'SIGNATURE') {
            // Automatically focus/edit only if it's a generic text field with no value? 
            // The user wanted "no placeholder", implying they might want to just drop it and have it be empty.
            // If it's a smart field with a value, maybe don't auto-edit?
            // Let's safe-guard: if it has a value, don't enter edit mode immediately?
            // actually user usually wants to position it first.
            setEditingFieldId(newField.id);
        }
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

    const handleSendClick = async () => {
        if (!validateForm()) return;

        // Generate preview link by creating document first
        try {
            // Convert blob URL to base64 if it's a blob
            let fileContent = undefined;
            console.log('🔍 File URL check:', consentForm.fileUrl);
            if (consentForm.fileUrl?.startsWith('blob:')) {
                console.log('📄 Converting blob URL to base64...');
                try {
                    const response = await fetch(consentForm.fileUrl);
                    const blob = await response.blob();
                    console.log('📦 Blob size:', blob.size, 'bytes, type:', blob.type);
                    const reader = new FileReader();
                    fileContent = await new Promise<string>((resolve) => {
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                    console.log('✅ Base64 conversion complete, length:', fileContent?.length);
                } catch (error) {
                    console.error('❌ Error converting blob to base64:', error);
                }
            } else {
                console.log('⚠️ File URL is not a blob, skipping base64 conversion');
            }

            console.log('📤 Creating document with:', {
                file_url: consentForm.fileUrl,
                has_file_content: !!fileContent,
                file_content_length: fileContent?.length,
                fields_count: consentForm.fields.length
            });

            const docResponse = await api.createDocument({
                patient: {
                    full_name: patientDetails.fullName,
                    email: patientDetails.email || undefined,
                    phone: patientDetails.phone || undefined,
                    dob: patientDetails.dob
                },
                procedure_name: consentForm.procedureName,
                file_url: consentForm.fileUrl,
                file_content: fileContent,  // Send base64 content
                doctor_name: consentForm.doctorName,
                clinic_name: consentForm.clinicName,
                fields: consentForm.fields
            });

            setPatientLink(docResponse.patient_link);
            setDocumentId(docResponse.id);
            setShowSendModal(true);
        } catch (error) {
            toast.error('Failed to generate document link');
        }
    };

    const confirmSend = async () => {
        try {
            // First check WizeChat configuration
            const wizechatStatus = await api.getWizeChatStatus();

            if (!wizechatStatus.configured) {
                toast.error(`WizeChat not configured: ${wizechatStatus.message}. Please configure in Settings.`, {
                    duration: 5000
                });
                return;
            }

            // Validate patient phone number
            if (!patientDetails.phone) {
                toast.error('Patient phone number is required to send via WhatsApp');
                return;
            }

            // Send via WhatsApp using the document ID
            const result = await api.sendWhatsApp(documentId, {
                inbox_id: '', // Will use hospital config
                phone_number: patientDetails.phone,
                send_via_whatsapp: true
            });

            if (result.success) {
                toast.success('Document sent to patient via WhatsApp!');
                setShowSendModal(false);
                navigate('/doctor/dashboard');
            } else {
                toast.error(result.message || 'Failed to send document. Please try again.', {
                    duration: 5000
                });
            }
        } catch (error: any) {
            const errorMessage = error?.message || error?.detail || 'Failed to send document. Please try again.';
            toast.error(errorMessage, {
                duration: 5000
            });
        }
    };

    const handleSaveAsTemplate = async () => {
        console.log("--- ATTEMPTING TO SAVE TEMPLATE ---");
        console.log("Procedure Name:", consentForm.procedureName);
        console.log("File URL:", consentForm.fileUrl);
        console.log("Template ID:", consentForm.template_id);

        if (!consentForm.procedureName || !consentForm.fileUrl) {
            console.error("Bailing out: procedureName or fileUrl is missing!", {
                procedureName: consentForm.procedureName,
                fileUrl: consentForm.fileUrl
            });
            toast.error("Please ensure the document has a title and file.");
            return;
        }

        let fileContent = undefined;
        if (consentForm.fileUrl?.startsWith('blob:')) {
            console.log("File is a blob, converting to base64...");
            try {
                const response = await fetch(consentForm.fileUrl);
                const blob = await response.blob();
                console.log("Blob fetched, size:", blob.size);
                const reader = new FileReader();
                fileContent = await new Promise<string>((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('Error converting blob to base64:', error);
            }
        }

        // If template_id exists, update existing template instead of creating new one
        if (consentForm.template_id) {
            console.log("Updating existing template with ID:", consentForm.template_id);
            saveTemplate({
                id: consentForm.template_id,
                name: consentForm.procedureName,
                file_url: consentForm.fileUrl,
                file_content: fileContent,
                fields: consentForm.fields,
                is_update: true
            }, {
                onSuccess: () => {
                    console.log("Frontend template update succcessful!");
                    toast.success('Template updated successfully!');
                },
                onError: (error) => {
                    console.error("Template update failed:", error);
                    toast.error("Template update failed");
                }
            });
        } else {
            console.log("Creating new template...");
            // Create new template
            saveTemplate({
                name: consentForm.procedureName,
                file_url: consentForm.fileUrl,
                file_content: fileContent,
                fields: consentForm.fields
            }, {
                onSuccess: () => {
                    console.log("Frontend template creation succcessful!");
                    toast.success('Template saved successfully!');
                },
                onError: (error) => {
                    console.error("Template creation failed:", error);
                    toast.error("Template creation failed");
                }
            });
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-slate-50 relative -m-4 md:-m-6">
            <div className="flex flex-col h-full bg-slate-50 p-4 md:p-6">
                <EditorHeader
                    procedureName={consentForm.procedureName}
                    onProcedureNameChange={(val) => updateConsentForm({ procedureName: val })}
                    onBack={() => navigate('/doctor/dashboard')}
                    onSaveTemplate={handleSaveAsTemplate}
                    isSavingTemplate={isSavingTemplate}
                    onSend={handleSendClick}
                    isSending={isSending}
                    canSend={!!(patientDetails.fullName && patientDetails.phone && consentForm.fields?.length)}
                />

                <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0 mt-4 md:mt-2">
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
                    patientLink={patientLink}
                />
            </div>
        </div>
    );
};
