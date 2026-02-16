const API_BASE = '/api';

/**
 * Helper for API requests
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  // For file downloads
  if (options.responseType === 'blob') {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
      throw new Error(errorData.error || 'Download failed');
    }
    return response.blob();
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

// ---- Admin API ----

function getAdminHeaders() {
  const creds = sessionStorage.getItem('adminCreds');
  if (!creds) throw new Error('Not authenticated');
  return { Authorization: `Basic ${creds}` };
}

/** Admin login */
export async function adminLogin(username, password) {
  const creds = btoa(`${username}:${password}`);
  const result = await request('/admin/login', {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}` },
  });
  sessionStorage.setItem('adminCreds', creds);
  return result;
}

/** Admin logout */
export function adminLogout() {
  sessionStorage.removeItem('adminCreds');
}

/** Get dashboard stats */
export async function getDashboard() {
  return request('/admin/dashboard', { headers: getAdminHeaders() });
}

/** Get payments with filters */
export async function getAdminPayments(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  return request(`/admin/payments?${params.toString()}`, { headers: getAdminHeaders() });
}

/** Create new entry (devotee + membership + payment) — admin manually enters all details */
export async function adminCreateEntry(data) {
  return request('/admin/create-entry', {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(data),
  });
}

/** Mark cash payment as received */
export async function markCashReceived(paymentId) {
  return request(`/admin/payments/${paymentId}/mark-cash-received`, {
    method: 'PUT',
    headers: getAdminHeaders(),
  });
}

/** Update payment details */
export async function updatePayment(paymentId, data) {
  return request(`/admin/payments/${paymentId}/update`, {
    method: 'PUT',
    headers: getAdminHeaders(),
    body: JSON.stringify(data),
  });
}

/** Admin resend receipt email */
export async function adminResendReceipt(paymentId) {
  return request(`/admin/payments/${paymentId}/resend-receipt`, {
    method: 'POST',
    headers: getAdminHeaders(),
  });
}

/** Admin download receipt PDF */
export async function adminDownloadReceipt(paymentId, txnId) {
  const creds = sessionStorage.getItem('adminCreds');
  const response = await fetch(`${API_BASE}/admin/payments/${paymentId}/download-receipt`, {
    headers: { Authorization: `Basic ${creds}` },
  });

  if (!response.ok) throw new Error('Download failed');

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SevaReceipt-${txnId || paymentId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/** Export all payments as CSV */
export async function exportPayments(filters = {}) {
  const creds = sessionStorage.getItem('adminCreds');
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  const response = await fetch(`${API_BASE}/admin/export?${params.toString()}`, {
    headers: { Authorization: `Basic ${creds}` },
  });

  if (!response.ok) throw new Error('Export failed');

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SSLT-Transactions-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
