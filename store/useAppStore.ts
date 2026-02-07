import { create } from 'zustand';
import { AppStep, PatientDetails, ConsentForm, SmartField } from '../types';

interface AppState {
  currentStep: AppStep;
  
  // Doctor/Form Data
  patientDetails: PatientDetails;
  consentForm: ConsentForm;
  
  // UI State for Editor
  activeFieldId: string | null;

  // Actions
  setStep: (step: AppStep) => void;
  updatePatientDetails: (details: Partial<PatientDetails>) => void;
  updateConsentForm: (data: Partial<ConsentForm>) => void;
  setDocumentFile: (url: string, type: string) => void;
  
  // Field Logic
  addField: (field: SmartField) => void;
  updateField: (id: string, data: Partial<SmartField>) => void;
  removeField: (id: string) => void;
  setFields: (fields: SmartField[]) => void;
  setActiveFieldId: (id: string | null) => void;
  
  // Integration Simulations
  startWizeFlowSession: (patient: PatientDetails) => void;
  startWizeChatSession: (patient: PatientDetails, form: ConsentForm) => void;
  resetSession: () => void;
}

const INITIAL_PATIENT: PatientDetails = {
  id: '',
  fullName: '',
  email: '',
  dob: ''
};

const INITIAL_FORM: ConsentForm = {
  procedureName: '',
  doctorName: 'Dr. Michael Chen',
  clinicName: 'Wizex Medical Center',
  generatedDate: new Date().toLocaleDateString(),
  fields: [],
  auditTrail: []
};

export const useAppStore = create<AppState>((set) => ({
  currentStep: AppStep.LANDING,
  patientDetails: { ...INITIAL_PATIENT },
  consentForm: { ...INITIAL_FORM },
  activeFieldId: null,

  setStep: (step) => set({ currentStep: step }),
  
  updatePatientDetails: (details) => 
    set((state) => ({ 
      patientDetails: { ...state.patientDetails, ...details } 
    })),

  updateConsentForm: (data) => 
    set((state) => ({ 
      consentForm: { ...state.consentForm, ...data } 
    })),

  setDocumentFile: (url, type) => 
    set((state) => ({
      consentForm: {
        ...state.consentForm,
        fileUrl: url,
        fileType: type
      }
    })),

  addField: (field) => 
    set((state) => ({
      consentForm: {
        ...state.consentForm,
        fields: [...(state.consentForm.fields || []), field]
      }
    })),

  updateField: (id, data) => 
    set((state) => ({
      consentForm: {
        ...state.consentForm,
        fields: state.consentForm.fields?.map(f => f.id === id ? { ...f, ...data } : f) || []
      }
    })),

  removeField: (id) => 
    set((state) => ({
      consentForm: {
        ...state.consentForm,
        fields: state.consentForm.fields?.filter(f => f.id !== id) || []
      }
    })),

  setFields: (fields) => 
    set((state) => ({
      consentForm: { ...state.consentForm, fields }
    })),

  setActiveFieldId: (id) => set({ activeFieldId: id }),

  startWizeFlowSession: (patient) => set({
    currentStep: AppStep.DOCTOR_DRAFTING,
    patientDetails: patient,
    consentForm: { ...INITIAL_FORM, transactionId: crypto.randomUUID() }
  }),

  startWizeChatSession: (patient, form) => set({
    currentStep: AppStep.PATIENT_REVIEW,
    patientDetails: patient,
    consentForm: form
  }),

  resetSession: () => set({
    currentStep: AppStep.LANDING,
    patientDetails: { ...INITIAL_PATIENT },
    consentForm: { ...INITIAL_FORM },
    activeFieldId: null
  })
}));