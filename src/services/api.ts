import { 
  DiagnosticSession, 
  RepairEstimate, 
  User, 
  UserFile, 
  ServiceCenter, 
  NotificationItem 
} from '../types';
import { firestoreSync } from './firestoreSync';

const TOKEN_KEY = 'fixbeforebuy_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Do not set Content-Type for FormData (file upload)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Auth
  async loginWithFirebase(idToken: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/firebase-session', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    });
    setStoredToken(res.token);
    return res;
  },

  async demoLogin(): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/demo', {
      method: 'POST'
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<User> {
    return request<User>('/api/auth/me');
  },

  // Diagnostics
  async getDiagnostics(): Promise<DiagnosticSession[]> {
    return request<DiagnosticSession[]>('/api/diagnostics');
  },

  async createDiagnostic(sessionData: Partial<DiagnosticSession>): Promise<DiagnosticSession> {
    const res = await request<DiagnosticSession>('/api/diagnostics', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
    firestoreSync.saveDiagnostic(res).catch(err => console.warn('Firestore diagnostic sync error:', err));
    return res;
  },

  async updateDiagnostic(id: string, updates: Partial<DiagnosticSession>): Promise<DiagnosticSession> {
    return request<DiagnosticSession>(`/api/diagnostics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteDiagnostic(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/diagnostics/${id}`, {
      method: 'DELETE'
    });
  },

  // Estimates
  async getEstimates(): Promise<RepairEstimate[]> {
    return request<RepairEstimate[]>('/api/estimates');
  },

  async createEstimate(estimateData: Partial<RepairEstimate>): Promise<RepairEstimate> {
    const res = await request<RepairEstimate>('/api/estimates', {
      method: 'POST',
      body: JSON.stringify(estimateData)
    });
    firestoreSync.saveEstimate(res).catch(err => console.warn('Firestore estimate sync error:', err));
    return res;
  },

  async updateEstimate(id: string, updates: Partial<RepairEstimate>): Promise<RepairEstimate> {
    return request<RepairEstimate>(`/api/estimates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteEstimate(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/estimates/${id}`, {
      method: 'DELETE'
    });
  },

  // Files
  async getFiles(): Promise<UserFile[]> {
    return request<UserFile[]>('/api/files');
  },

  async uploadFile(file: File, category: string, relatedSessionId?: string): Promise<UserFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (relatedSessionId) {
      formData.append('relatedSessionId', relatedSessionId);
    }
    return request<UserFile>('/api/files/upload', {
      method: 'POST',
      body: formData
    });
  },

  async deleteFile(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/files/${id}`, {
      method: 'DELETE'
    });
  },

  async downloadFile(id: string): Promise<Blob> {
    const token = getStoredToken();
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`/api/files/${id}/download`, { headers });
    if (!response.ok) {
      let errorMessage = `File request failed (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        // ignore non-JSON errors
      }
      throw new Error(errorMessage);
    }

    return response.blob();
  },

  // Service Centers
  async getServiceCenters(): Promise<ServiceCenter[]> {
    return request<ServiceCenter[]>('/api/service-centers');
  },

  async requestQuote(payload: {
    serviceCenterId: string;
    diagnosticSessionId?: string;
    applianceDescription: string;
    problemSummary: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    preferredContact?: string;
  }): Promise<{ success: boolean; estimate: RepairEstimate; referenceNumber?: string; message?: string; autoGuestToken?: string }> {
    const res = await request<{ success: boolean; estimate: RepairEstimate; referenceNumber?: string; message?: string; autoGuestToken?: string }>('/api/service-centers/quote-request', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.estimate) {
      firestoreSync.saveEstimate(res.estimate).catch(err => console.warn('Firestore quote sync error:', err));
    }
    if (res.autoGuestToken && !getStoredToken()) {
      setStoredToken(res.autoGuestToken);
    }
    return res;
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    return request<NotificationItem[]>('/api/notifications');
  },

  async markNotificationsRead(id?: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  },

  async simulatePushNotification(): Promise<NotificationItem> {
    return request<NotificationItem>('/api/notifications/simulate', {
      method: 'POST'
    });
  }
};
