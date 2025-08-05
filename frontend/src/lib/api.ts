const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a timeout promise
const timeoutPromise = (ms: number) => 
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout')), ms)
  );

export async function apiFetch(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  const token = localStorage.getItem('token');

  try {
    const res = await Promise.race([
      fetch(`${API_URL}${path}`, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...(options.headers || {})
        },
        signal: controller.signal,
      }),
      timeoutPromise(30000)
    ]);

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('isNewUser');
        window.location.href = '/login';
        return;
      }
      const error = await res.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP error! status: ${res.status}`);
    }
    
    if (res.status === 204) return null;
    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
    
    throw new Error('Network error');
  }
}

export const apiUpload = async (endpoint: string, formData: FormData) => {
  const token = localStorage.getItem('token');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for uploads

  try {
    const response = await Promise.race([
      fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
        signal: controller.signal,
      }),
      timeoutPromise(30000)
    ]);

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'File upload failed' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Upload timeout');
      }
      throw error;
    }
    
    throw new Error('Upload failed');
  }
};
