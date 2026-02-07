import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Assuming router is set up
import { useAppStore } from '../store/useAppStore';
import { useTemplates, useUpdateTemplate } from '../hooks/useAppQueries'; // Added useDeleteTemplate if available, otherwise ignore or mock
import { TemplateList } from './doctor/TemplateList';
import { CreateTemplateModal } from './doctor/CreateTemplateModal';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;
}

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    setDocumentFile, updateConsentForm, setFields, patientDetails, updatePatientDetails
  } = useAppStore();

  // Handle Deep Linking Context
  useEffect(() => {
    const pId = searchParams.get('patient_id');
    if (pId) {
      // If we have a patient ID from SSO/Deep Link, update the store
      // In a real app, we might fetch full details from API using this ID
      // For now, checking if name is also passed or if we need to fetch
      // Assuming SSOHandler might pass name/email if strictly needed, 
      // OR we trust the ID lookup later. 
      // But for "Clicking template uses that patient details", let's assume valid context

      // TODO: Ideally call api.getPatient(pId) here
      updatePatientDetails({
        id: pId,
        fullName: searchParams.get('patient_name') || 'Patient', // Fallback
        email: searchParams.get('patient_email') || '',
        // If phone/dob passed
      });
    }
  }, [searchParams, updatePatientDetails]);

  const { data: templates } = useTemplates();
  const { mutate: updateTemplate } = useUpdateTemplate();
  // const { mutate: deleteTemplate } = useDeleteTemplate(); // If this exists

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const handleTemplateSelect = (url: string, name: string) => {
    setDocumentFile(url, 'image/jpeg');
    updateConsentForm({ procedureName: name });

    // Pre-fill fields for existing template 
    // In a real app, the template would store its fields configuration. 
    // Here we hardcode the fields generator for demo purposes as per original code.
    setFields([
      {
        id: 'title-field',
        type: 'TEXT',
        label: 'Form Title',
        x: 5, y: 5, w: 90, h: 6,
        value: name.toUpperCase(),
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center'
      },
      { id: 'f1', type: 'TEXT', label: 'Patient Name', x: 14, y: 19.5, w: 35, h: 2.5, value: patientDetails.fullName || '', fontSize: 14 },
      { id: 'f2', type: 'DATE', label: 'Date', x: 75, y: 19.5, w: 15, h: 2.5, value: new Date().toLocaleDateString(), fontSize: 14 },
      { id: 'f3', type: 'SIGNATURE', label: 'Patient Signature', x: 15, y: 92, w: 40, h: 4 }
    ]);

    navigate('/doctor/editor');
  };

  const handleCreateSession = async (name: string, file: File) => {
    setIsProcessingPdf(true);
    const nameToUse = name.trim() || file.name.replace('.pdf', '').replace(/_/g, ' ');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const originalViewport = page.getViewport({ scale: 1 });
      const scale = 1600 / originalViewport.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        const imgUrl = canvas.toDataURL('image/jpeg', 0.9);

        setDocumentFile(imgUrl, 'application/pdf'); // Store keeps the image URL
        updateConsentForm({ procedureName: nameToUse });

        setFields([
          {
            id: 'title-field',
            type: 'TEXT',
            label: 'Form Title',
            x: 5, y: 5, w: 90, h: 6,
            value: nameToUse.toUpperCase(),
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center'
          },
          {
            id: 'auto-date',
            type: 'DATE',
            label: 'Date',
            x: 75, y: 19.5, w: 15, h: 2.5,
            value: new Date().toLocaleDateString(),
            fontSize: 14
          }
        ]);

        setShowCreateModal(false);
        navigate('/doctor/editor');
      }
    } catch (err) {
      console.error(err);
      alert("Error processing PDF. Please try a different file.");
    } finally {
      setIsProcessingPdf(false);
    }
  };

  return (
    <>
      <TemplateList
        templates={templates}
        onSelect={handleTemplateSelect}
        onCreate={() => setShowCreateModal(true)}
        onRename={(id, newName) => updateTemplate({ id, name: newName })}
        onDelete={(id) => console.log("Delete not implemented in hook yet", id)}
      />
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSession}
        isProcessing={isProcessingPdf}
      />
    </>
  );
};