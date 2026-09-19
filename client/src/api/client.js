/**
 * One place that knows how to talk to the Express API.
 * Attaches the JWT, unwraps JSON, and turns error responses
 * into thrown Errors so Redux thunks can reject cleanly.
 */

const TOKEN_KEY = 'echo_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),

  /** Uploads a File object and resolves to its public URL. */
  uploadImage: async (file, type = 'post') => {
    const form = new FormData();
    form.append('image', file);
    const { url } = await request(`/upload?type=${type}`, {
      method: 'POST',
      body: form,
      isForm: true,
    });
    return url;
  },
};
