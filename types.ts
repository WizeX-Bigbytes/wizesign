export enum AppStep {
  LANDING = 'LANDING',
  DOCTOR_DRAFTING = 'DOCTOR_DRAFTING',
  PATIENT_REVIEW = 'PATIENT_REVIEW',
  COMPLETED = 'COMPLETED'
}

export interface PatientDetails {
  id: string;
  fullName: string;
  dob: string;
  email: string;
}

export interface AuditEvent {
  timestamp: string;
  action: string;
  actor: string;
  details: string;
}

export interface SmartField {
  id: string;
  type: 'TEXT' | 'DATE' | 'SIGNATURE';
  label: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  w: number; // Percentage width
  h: number; // Percentage height
  value?: string; // The prefilled text
  fontSize?: number; // Font size in pixels
  fontWeight?: string; // 'normal' | 'bold'
  textAlign?: 'left' | 'center' | 'right';
}

export interface ConsentForm {
  procedureName: string;
  doctorName: string;
  clinicName: string;
  fileUrl?: string; // Blob URL for the uploaded PDF/Image
  fileType?: string; // 'application/pdf' or 'image/...'
  notes?: string;
  fields?: SmartField[]; // The draggable fields
  generatedDate: string;
  signature?: string; // Base64 data URL
  signedDate?: string;
  transactionId?: string;
  auditTrail?: AuditEvent[];
}

export interface SignaturePadProps {
  onSave: (signatureData: string) => void;
}