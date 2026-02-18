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
  dob: '',
  phone: ''
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
    set((state) => {
      const newDetails = { ...state.patientDetails, ...details };
      // Auto-update linked fields when patient details change
      const updatedFields = state.consentForm.fields?.map(field => {
        if (field.source === 'patient.fullName' && details.fullName !== undefined) return { ...field, value: details.fullName };
        if (field.source === 'patient.phone' && details.phone !== undefined) return { ...field, value: details.phone };
        if (field.source === 'patient.email' && details.email !== undefined) return { ...field, value: details.email };
        if (field.source === 'patient.dob' && details.dob !== undefined) return { ...field, value: details.dob };
        return field;
      });
      
      return { 
        patientDetails: newDetails,
        consentForm: { ...state.consentForm, fields: updatedFields || state.consentForm.fields }
      };
    }),

  updateConsentForm: (data) => 
    set((state) => {
      let updatedFields = data.fields || state.consentForm.fields;
      
      // If we are not explicitly updating fields, but updating metadata, sync it
      if (!data.fields) {
        if (data.doctorName !== undefined || data.clinicName !== undefined || data.generatedDate !== undefined) {
           updatedFields = updatedFields?.map(field => {
             if (field.source === 'doctor.name' && data.doctorName !== undefined) return { ...field, value: data.doctorName };
             if (field.source === 'meta.clinic' && data.clinicName !== undefined) return { ...field, value: data.clinicName };
             if (field.source === 'meta.date' && data.generatedDate !== undefined) return { ...field, value: data.generatedDate };
             return field;
           });
        }
      }

      return { 
        consentForm: { ...state.consentForm, ...data, fields: updatedFields } 
      };
    }),

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