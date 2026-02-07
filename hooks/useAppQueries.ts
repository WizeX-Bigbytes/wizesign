import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConsentForm, PatientDetails, AuditEvent } from '../types';
import { api } from '../services/api';

// -- Hooks --

export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const templates = await api.fetchTemplates();
      return templates.map((t: any) => ({
        ...t,
        url: t.file_url // Map backend file_url to frontend url
      }));
    },
  });
};

export const useSaveTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.saveTemplate,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string, name: string }) => api.updateTemplate(data.id, { name: data.name }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });
};

export const useSendToPatient = () => {
  return useMutation({
    mutationFn: async (data: { patient: PatientDetails, form: ConsentForm }) => {
        // 1. Create document in backend
        const docResponse = await api.createDocument({
            patient: {
                full_name: data.patient.fullName,
                email: data.patient.email,
                dob: data.patient.dob
            },
            procedure_name: data.form.procedureName,
            file_url: data.form.fileUrl,
            doctor_name: data.form.doctorName,
            clinic_name: data.form.clinicName,
            fields: data.form.fields
        });

        // 2. Send WhatsApp link (WizeChat integration)
        // Hardcoded inbox_id/phone for now or get from context if available
        // In a real app these would be dynamic or environmental
        await api.sendWhatsApp(docResponse.id, {
            inbox_id: 'default-inbox', 
            phone_number: '+15550000000', // Should come from patient data or UI
            send_via_whatsapp: true
        });

        return { success: true, transactionId: docResponse.transaction_id };
    },
  });
};

export const useSubmitSignature = () => {
  return useMutation({
    mutationFn: async (data: { 
      formId: string, 
      signature: string, 
      auditEvents: AuditEvent[] 
    }) => {
       const response = await api.submitSignature(data.formId, {
           signature: data.signature,
           audit_events: data.auditEvents
       });
       return {
           success: true,
           signedDate: response.signed_date,
           finalHash: response.transaction_id // Using transaction ID as hash proxy
       };
    },
  });
};

export const useDocumentByToken = (token: string | null) => {
    return useQuery({
        queryKey: ['document', token],
        queryFn: () => token ? api.getDocumentByToken(token) : Promise.reject('No token'),
        enabled: !!token,
        retry: false
    });
};