// Use relative path for production (Nginx proxy) and development (Vite proxy)
export const API_BASE_URL = '/api';

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

  submitSignature: async (documentId: string, data: { signature: string, ip_address?: string, audit_events?: any[] }, token: string) => {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/sign?token=${token}`, {
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

  listDocuments: async (options?: { statusFilter?: string, patientId?: string, search?: string }) => {
    let url = `${API_BASE_URL}/documents/`;
    const params = new URLSearchParams();
    
    if (options?.statusFilter && options.statusFilter !== 'ALL') {
      params.append('status_filter', options.statusFilter);
    }
    if (options?.patientId) {
      params.append('patient_id', options.patientId);
    }
    if (options?.search) {
      params.append('search', options.search);
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

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
    const response = await fetch(`${API_BASE_URL}/templates/`, { headers: getAuthHeaders() });
    return handleResponse<any[]>(response);
  },

  getTemplate: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, { headers: getAuthHeaders() });
    return handleResponse<any>(response);
  },
  
  saveTemplate: async (data: any) => {
    // If is_update flag is set and id exists, use PATCH to update existing template
    if (data.is_update && data.id) {
      const { id, is_update, ...updateData } = data;
      const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updateData),
      });
      return handleResponse<any>(response);
    }
    
    // Otherwise create new template
    const response = await fetch(`${API_BASE_URL}/templates/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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

  async checkWizeChatConnection() {
    const response = await fetch(`${API_BASE_URL}/hospitals/me/check-wizechat`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to check WizeChat connection');
    return response.json();
  },

  updateTemplate: async (id: string, data: any) => {
     const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  deleteTemplate: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || 'Failed to delete template');
    }
    return true;
  },

  // ============ Super Admin ============
  getSuperAdminStats: async () => {
    const response = await fetch(`${API_BASE_URL}/superadmin/dashboard-stats`, { headers: getAuthHeaders() });
    return handleResponse<any>(response);
  },

  listAllHospitals: async (skip = 0, limit = 50) => {
    const response = await fetch(`${API_BASE_URL}/superadmin/hospitals?skip=${skip}&limit=${limit}`, { headers: getAuthHeaders() });
    return handleResponse<any[]>(response);
  },

  listAllUsers: async (skip = 0, limit = 50) => {
    const response = await fetch(`${API_BASE_URL}/superadmin/users?skip=${skip}&limit=${limit}`, { headers: getAuthHeaders() });
    return handleResponse<any[]>(response);
  },

  resolveUrl: (url: string) => {
    // If the URL is already absolute, return it
    if (url.startsWith('http')) return url;
    
    // If it starts with /api (from the new mapping), use relative to current origin proxy
    if (url.startsWith('/api')) return url;
    
    // Fallback just in case
    return `${API_BASE_URL}${url}`;
  }
};
