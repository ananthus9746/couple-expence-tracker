/**
 * api.js — central API client for The Duel backend
 * Base URL: http://localhost:5004/api
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api'

/* ── Token helpers ── */
export const getToken  = ()        => localStorage.getItem('duel-token')
export const setToken  = (token)   => localStorage.setItem('duel-token', token)
export const clearToken = ()       => localStorage.removeItem('duel-token')

/* ── Base fetch wrapper ── */
async function request(path, options = {}) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.message || `Request failed: ${res.status}`)
    err.status = res.status
    err.data   = data
    throw err
  }

  return data
}

/* ════════════════════════════════════════════
   AUTH
════════════════════════════════════════════ */
export const auth = {
  register: (body) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  getInviteDetails: (code) =>
    request(`/auth/invite-details/${code}`),

  joinWithCode: (inviteCode) =>
    request('/auth/join-with-code', { method: 'POST', body: JSON.stringify({ inviteCode }) }),

  verifyOtp: (body) =>
    request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(body) }),

  resendOtp: (email) =>
    request('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) }),

  login: (body) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  getMe: () =>
    request('/auth/me'),

  updateProfile: (body) =>
    request('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),

  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (body) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  changePassword: (body) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),
}

/* ════════════════════════════════════════════
   COUPLES
════════════════════════════════════════════ */
export const couples = {
  create: (body) =>
    request('/couples/create', { method: 'POST', body: JSON.stringify(body) }),

  join: (body) =>
    request('/couples/join', { method: 'POST', body: JSON.stringify(body) }),

  getMe: () =>
    request('/couples/me'),

  update: (body) =>
    request('/couples/me', { method: 'PATCH', body: JSON.stringify(body) }),

  stats: () =>
    request('/couples/stats'),

  sendInvite: (email) =>
    request('/couples/invite', { method: 'POST', body: JSON.stringify({ email }) }),

  leave: () =>
    request('/couples/leave', { method: 'DELETE' }),
}

/* ════════════════════════════════════════════
   EXPENSES
════════════════════════════════════════════ */
export const expenses = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString()
    return request(`/expenses${qs ? `?${qs}` : ''}`)
  },

  add: (body) =>
    request('/expenses', { method: 'POST', body: JSON.stringify(body) }),

  get: (id) =>
    request(`/expenses/${id}`),

  update: (id, body) =>
    request(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: (id) =>
    request(`/expenses/${id}`, { method: 'DELETE' }),

  summary: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/expenses/summary${qs ? `?${qs}` : ''}`)
  },

  seedDemo: (expensesArr) =>
    request('/expenses/seed-demo', { method: 'POST', body: JSON.stringify({ expenses: expensesArr }) }),
}
