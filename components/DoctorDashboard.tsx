import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useTemplates, useUpdateTemplate } from '../hooks/useAppQueries';
import { api } from '../services/api';
import { TemplateList } from './doctor/TemplateList';
import { CreateTemplateModal } from './doctor/CreateTemplateModal';
import { DocumentsList } from './doctor/DocumentsList';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { FileText, FolderOpen } from 'lucide-react';

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

  const [viewMode, setViewMode] = useState<'templates' | 'documents'>('templates');
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [wizechatStatus, setWizechatStatus] = useState<any>(null);
  const [showWizechatBanner, setShowWizechatBanner] = useState(true);

  // Check WizeChat configuration on mount
  useEffect(() => {
    checkWizeChatStatus();
  }, []);

  const checkWizeChatStatus = async () => {
    try {
      const status = await api.getWizeChatStatus();
      setWizechatStatus(status);
    } catch (error) {
      console.error('Failed to check WizeChat status', error);
    }
  };

  // Handle Deep Linking Context from SSO
  useEffect(() => {
    const action = searchParams.get('action');
    const pId = searchParams.get('patient_id');
    
    if (pId) {
      console.log(`SSO Deep Link detected: action=${action}, patient_id=${pId}`);
      
      // Update patient details in store from URL params
      updatePatientDetails({
        id: pId,
        fullName: searchParams.get('patient_name') || 'Patient from WizeFlow',
        email: searchParams.get('patient_email') || '',
        phone: searchParams.get('patient_phone') || '',
        dob: searchParams.get('patient_dob') || ''
      });

      // If action is 'send', patient details are pre-filled from WizeFlow
      if (action === 'send') {
        console.log('Ready to send document to patient:', pId);
        console.log('Patient details auto-filled from WizeFlow');
        // User will click a template, which will use the pre-filled patient details
      }
    }
  }, [searchParams, updatePatientDetails]);

  // Load documents when switching to documents view
  useEffect(() => {
    if (viewMode === 'documents') {
      loadDocuments();
    }
  }, [viewMode]);

  const loadDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      const docs = await api.listDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleViewDocument = (documentId: string) => {
    navigate(`/doctor/document/${documentId}`);
  };

  const { data: templates } = useTemplates();
  const { mutate: updateTemplate } = useUpdateTemplate();
  // const { mutate: deleteTemplate } = useDeleteTemplate(); // If this exists

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const handleTemplateSelect = (url: string, name: string, templateId?: string) => {
    setDocumentFile(url, 'image/jpeg');
    updateConsentForm({ 
      procedureName: name,
      template_id: templateId // Track template ID for updates
    });

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
      // Keep the original file as a blob URL for the editor
      const fileUrl = URL.createObjectURL(file);
      
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

        // Generate preview image for editing UI
        const imgUrl = canvas.toDataURL('image/jpeg', 0.9);

        // Store BOTH: preview image for UI AND original PDF blob URL
        setDocumentFile(fileUrl, 'application/pdf'); // Original PDF blob
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
    <div className="h-full flex flex-col">
      {/* WizeChat Configuration Banner */}
      {wizechatStatus && !wizechatStatus.configured && showWizechatBanner && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3">
            <div className="flex items-start gap-3 justify-between">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-lg shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 text-sm">WizeChat Not Configured</h3>
                  <p className="text-amber-800 text-xs mt-0.5">
                    {wizechatStatus.message}. Configure WizeChat to send documents via WhatsApp.
                  </p>
                  <button
                    onClick={() => navigate('/settings')}
                    className="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
                  >
                    Configure Now →
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowWizechatBanner(false)}
                className="text-amber-600 hover:text-amber-800 p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Toggle - Aligned with content */}
      <div className="max-w-6xl w-full mx-auto px-4 md:px-6 pt-4 shrink-0">
        <div className="flex gap-1 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/60 w-fit mb-2">
          <button
            onClick={() => setViewMode('templates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              viewMode === 'templates'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => setViewMode('documents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              viewMode === 'documents'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Documents
            {documents.length > 0 && (
                <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] ml-1">{documents.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Conditional View */}
      <div className="flex-1 min-h-0">
        {viewMode === 'templates' ? (
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
        ) : (
          <DocumentsList
            documents={documents}
            onViewDocument={handleViewDocument}
            isLoading={isLoadingDocuments}
          />
        )}
      </div>
    </div>
  );
};