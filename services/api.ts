export const API_BASE_URL = 'http://localhost:8000/api';

export interface ApiError {
  detail: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || 'API request failed');
  }
  return response.json();
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};


export const api = {
  // Documents
  createDocument: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/documents/create`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders() 
      },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  getDocumentByToken: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/documents/by-token/${token}`);
    return handleResponse<any>(response);
  },

  submitSignature: async (documentId: string, data: { signature: string, ip_address?: string, audit_events?: any[] }) => {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  downloadSignedDocument: async (documentId: string) => {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || 'Failed to download document');
    }
    // Return blob for download
    return response.blob();
  },

  sendWhatsApp: async (documentId: string, data: { inbox_id: string, phone_number: string, send_via_whatsapp: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/send-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    // Special handling for WhatsApp responses - they may return 200 with success=false
    const result = await response.json();
    
    if (!response.ok) {
      // HTTP error
      throw new Error(result.detail || 'Failed to send WhatsApp message');
    }
    
    // Check if the operation itself failed even with 200 status
    if (result.success === false) {
      throw new Error(result.message || result.error || 'Failed to send WhatsApp message');
    }
    
    return result;
  },

  listDocuments: async (statusFilter?: string) => {
    const url = statusFilter 
      ? `${API_BASE_URL}/documents/?status_filter=${statusFilter}`
      : `${API_BASE_URL}/documents/`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse<any[]>(response);
  },

  getDocument: async (documentId: string) => {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<any>(response);
  },

  // Templates
  fetchTemplates: async () => {
    const response = await fetch(`${API_BASE_URL}/templates/`);
    return handleResponse<any[]>(response);
  },
  
  saveTemplate: async (data: any) => {
    // If is_update flag is set and id exists, use PATCH to update existing template
    if (data.is_update && data.id) {
      const { id, is_update, ...updateData } = data;
      const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      return handleResponse<any>(response);
    }
    
    // Otherwise create new template
    const response = await fetch(`${API_BASE_URL}/templates/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Auth / SSO
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw { response: { data: error } };
    }
    return response.json();
  },

  validateSSO: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/sso/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, source: 'wizeflow' }),
    });
    if (!response.ok) throw new Error('SSO Validation Failed');
    return response.json();
  },

  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json();
  },

  generateTestToken: async (payload: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/sso/generate-test-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
    });
    if (!response.ok) throw new Error('Failed to generate token');
    return response.json();
  },

  async getMyHospital() {
    const response = await fetch(`${API_BASE_URL}/hospitals/me`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch hospital');
    return response.json();
  },

  async updateHospitalSettings(data: any) {
    const response = await fetch(`${API_BASE_URL}/hospitals/me/settings`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
  },

  async getWizeChatStatus() {
    const response = await fetch(`${API_BASE_URL}/hospitals/me/wizechat-status`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch WizeChat status');
    return response.json();
  },

  updateTemplate: async (id: string, data: any) => {
     const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  }
};
