import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useQueryClient } from '@tanstack/react-query';
import { useTemplates, useUpdateTemplate, useDeleteTemplate } from '../hooks/useAppQueries';
import { api } from '../services/api';
import { TemplateList } from './doctor/TemplateList';
import { CreateTemplateModal } from './doctor/CreateTemplateModal';
import { DocumentsList } from './doctor/DocumentsList';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { FileText, FolderOpen, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDisplayDate } from '../utils/dateUtils';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;
}

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const {
    setDocumentFile, updateConsentForm, setFields, patientDetails, updatePatientDetails
  } = useAppStore();

  const viewMode = searchParams.get('view') === 'documents' ? 'documents' : 'templates';
  const [activeTemplateFilter, setActiveTemplateFilter] = useState<string>('');
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('ALL');
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

  // Load documents when view mode changes or filters update
  useEffect(() => {
    if (viewMode === 'documents') {
      loadDocuments();
    }
  }, [viewMode, activeTemplateFilter, activeSearchQuery]); // Removed activeTemplateFilter from triggering directly unless it changes

  const loadDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      // Use the active template filter if set, otherwise use the search query
      const searchQuery = activeTemplateFilter || activeSearchQuery;
      const docs = await api.listDocuments({
        statusFilter: activeStatusFilter,
        search: searchQuery
      });
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleSearchChange = (query: string, status: string) => {
    // If user types in the search box, clear the hardcoded template filter
    if (query !== activeTemplateFilter && activeTemplateFilter !== '') {
      setActiveTemplateFilter('');
    }
    setActiveSearchQuery(query);
    setActiveStatusFilter(status);
  };

  const handleViewDocument = (documentId: string) => {
    navigate(`/doctor/document/${documentId}`);
  };

  const { data: templates } = useTemplates();
  const { mutate: updateTemplate } = useUpdateTemplate();
  const { mutate: deleteTemplate } = useDeleteTemplate();

  const handleDuplicateTemplate = async (id: string) => {
    try {
      const original = await api.getTemplate(id);
      await api.saveTemplate({
        name: `Copy of ${original.name}`,
        file_url: original.file_url,
        file_path: original.file_path,
        fields: original.fields,
      });
      toast.success(`"Copy of ${original.name}" created!`);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to duplicate template');
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const handleTemplateSelect = async (url: string, name: string, templateId?: string, fields?: any[]) => {
    setIsProcessingPdf(true);
    try {
      // 1. Fetch the PDF Blob from the API with proper Auth headers
      const response = await fetch(api.resolveUrl(url), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || "Failed to download template");
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // 2. Render PDF to Image using PDF.js
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

        // 3. Set standard template data in store
        // Use the original URL (now authenticated if needed later) as the original PDF blob reference
        const fileUrl = URL.createObjectURL(blob);

        // Store both the PDF for saving and the Image for visual canvas rendering
        setDocumentFile(fileUrl, 'application/pdf', imgUrl);

        updateConsentForm({
          procedureName: name,
          template_id: templateId // Track template ID for updates
        });

        if (fields && fields.length > 0) {
          setFields(fields);
        } else {
          setFields([
            { id: 'title-field', type: 'TEXT', label: 'Form Title', x: 5, y: 5, w: 90, h: 6, value: name.toUpperCase(), fontSize: 24, fontWeight: 'bold', textAlign: 'center', page: 1 },
            { id: 'f1', type: 'TEXT', label: 'Patient Name', x: 14, y: 19.5, w: 35, h: 2.5, value: patientDetails.fullName || '', fontSize: 14, page: 1 },
            { id: 'f2', type: 'DATE', label: 'Date', x: 75, y: 19.5, w: 15, h: 2.5, value: formatDisplayDate(new Date()), fontSize: 14, page: 1 },
            { id: 'f3', type: 'SIGNATURE', label: 'Patient Signature', x: 15, y: 92, w: 40, h: 4, page: 1 }
          ]);
        }

        navigate('/doctor/editor');
      }
    } catch (err: any) {
      console.error("Template rendering failed", err);
      toast.error(err?.message || "Error loading template document. Please try again.");
    } finally {
      setIsProcessingPdf(false);
    }
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
        setDocumentFile(fileUrl, 'application/pdf', imgUrl);
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
            textAlign: 'center',
            page: 1
          },
          {
            id: 'auto-date',
            type: 'DATE',
            label: 'Date',
            x: 75, y: 19.5, w: 15, h: 2.5,
            value: formatDisplayDate(new Date()),
            fontSize: 14,
            page: 1
          }
        ]);

        setShowCreateModal(false);
        navigate('/doctor/editor');
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error processing PDF. Please try a different file.");
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const isDark = useAppStore(state => state.theme === 'dark');

  return (
    <div className={`h-full flex flex-col transition-colors duration-300 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* WizeChat Configuration Banner */}
      {wizechatStatus && !wizechatStatus.configured && showWizechatBanner && (
        <div className={`mx-4 mt-2 mb-6 p-4 rounded-2xl border flex items-center justify-between animate-in slide-in-from-top-2 duration-500 ${isDark ? 'bg-amber-950/20 border-amber-900/50 text-amber-200' : 'bg-amber-50 border-amber-100 text-amber-800 shadow-sm'
          }`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Action Required: WizeChat Not Configured</p>
              <p className={`text-xs mt-0.5 font-medium opacity-80`}>Set up your WizeChat API details in settings to enable WhatsApp document sending.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/doctor/settings')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-amber-400 text-amber-950 hover:bg-amber-300' : 'bg-amber-900 text-white hover:bg-amber-950 shadow-md shadow-amber-900/20'
                }`}
            >
              Configure Now
            </button>
            <button
              onClick={() => setShowWizechatBanner(false)}
              className="p-2 rounded-lg hover:bg-black/5 opacity-40 hover:opacity-100 transition-all font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}



      {/* Conditional View */}
      <div className="flex-1 min-h-0">
        {viewMode === 'templates' ? (
          <>
            <TemplateList
              templates={templates}
              onSelect={handleTemplateSelect}
              onCreate={() => setShowCreateModal(true)}
              onRename={(id, newName) => updateTemplate({ id, name: newName })}
              onDelete={(id) => deleteTemplate(id)}
              onBulkDelete={async (ids) => {
                try {
                  // Execute sequentially to avoid overwhelming the network or use Promise.all
                  const promises = ids.map(id => api.deleteTemplate(id));
                  await Promise.all(promises);
                  toast.success(`Successfully deleted ${ids.length} templates`);
                  queryClient.invalidateQueries({ queryKey: ['templates'] });
                } catch (error) {
                  console.error("Bulk delete failed:", error);
                  toast.error("Some templates failed to delete. Please try again.");
                }
              }}
              onViewDocuments={(name) => {
                setActiveTemplateFilter(name);
                navigate('/doctor/dashboard?view=documents');
              }}
              onDuplicate={handleDuplicateTemplate}
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
            initialSearchQuery={activeTemplateFilter || activeSearchQuery}
            onSearchChange={handleSearchChange}
          />
        )}
      </div>
    </div>
  );
};