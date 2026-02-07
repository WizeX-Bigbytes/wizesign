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
    const token = localStorage.getItem('wizesign_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};


export const api = {
  // Documents
  createDocument: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/documents/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  sendWhatsApp: async (documentId: string, data: { inbox_id: string, phone_number: string, send_via_whatsapp: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/send-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Templates
  fetchTemplates: async () => {
    const response = await fetch(`${API_BASE_URL}/templates/`);
    return handleResponse<any[]>(response);
  },
  
  saveTemplate: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/templates/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Auth / SSO
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
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json();
  },

  generateTestToken: async (payload: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/sso/generate-test-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to generate token');
    return response.json();
  },

  async getMyHospital() {
    const response = await fetch(`${API_BASE_URL}/hospitals/me`, {
        headers: getAuthHeaders(),
    });
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

  updateTemplate: async (id: string, data: any) => {
     const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  }
};
