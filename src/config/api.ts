/**
 * API Configuration
 * Centralized API URL configuration for the entire application
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    PROFILE: `${API_URL}/api/auth/profile`,
    LOGIN: `${API_URL}/api/auth/login`,
    SIGNUP: `${API_URL}/api/auth/signup`,
  },
  
  // Address endpoints
  ADDRESSES: {
    GENERATE: `${API_URL}/api/addresses/generate`,
    GENERATE_COMPANY: `${API_URL}/api/addresses/generate-company`,
    GENERATE_WITH_LOCATION: `${API_URL}/api/addresses/generate-with-location`,
    GENERATE_WITH_W3W: `${API_URL}/api/addresses/generate-with-precision`,
    LIST: `${API_URL}/api/addresses`,
    SHARE_EMAIL: `${API_URL}/api/addresses/share-via-email`,
    SHARE_SMS: `${API_URL}/api/addresses/share-via-sms`,
    DELETE: `${API_URL}/api/addresses`,
  },
  
  // Payment endpoints
  PAYMENTS: {
    INITIATE: `${API_URL}/api/payments/initiate`,
    SIMULATE: `${API_URL}/api/payments/simulate`,
    STATUS: `${API_URL}/api/payments/status`,
  },
  
  // Admin endpoints
  ADMIN: {
    STATS: `${API_URL}/api/admin/stats`,
    USERS: `${API_URL}/api/admin/users`,
    ADDRESSES: `${API_URL}/api/admin/addresses`,
    PAYMENTS: `${API_URL}/api/admin/payments`,
    REVENUE: `${API_URL}/api/admin/revenue`,
    SEND_EMAIL: (userId: string) => `${API_URL}/api/admin/users/${userId}/send-email`,
    DELETE_USER: (userId: string) => `${API_URL}/api/admin/users/${userId}`,
    UPDATE_USER_ROLE: (userId: string) => `${API_URL}/api/admin/users/${userId}/role`,
  },
  
  // Notification endpoints
  NOTIFICATIONS: {
    SEND_BULK: `${API_URL}/api/notifications/send-bulk`,
    WELCOME: `${API_URL}/api/notifications/welcome`,
  },
  
  // Package endpoints
  PACKAGES: {
    LIST: `${API_URL}/api/packages`,
    GET: (id: string) => `${API_URL}/api/packages/${id}`,
    CREATE: `${API_URL}/api/packages`,
    UPDATE: (id: string) => `${API_URL}/api/packages/${id}`,
    UPDATE_STATUS: (id: string) => `${API_URL}/api/packages/${id}/status`,
    STATS: `${API_URL}/api/packages/stats/summary`,
  },
  
  // Security endpoints
  SECURITY: {
    ALERTS: `${API_URL}/api/security/alerts`,
    ALERT: (id: string) => `${API_URL}/api/security/alerts/${id}`,
    BLOCKED_IPS: `${API_URL}/api/security/blocked-ips`,
    BLOCK_IP: (id: string) => `${API_URL}/api/security/blocked-ips/${id}`,
    SYSTEM_STATUS: `${API_URL}/api/security/system-status`,
    AUDIT_LOGS: `${API_URL}/api/security/audit-logs`,
    STATS: `${API_URL}/api/security/stats`,
  },
  
  // Government services endpoints
  GOVERNMENT: {
    DEPARTMENTS: `${API_URL}/api/government/departments`,
    SERVICES: `${API_URL}/api/government/services`,
    APPLICATIONS: `${API_URL}/api/government/applications`,
    APPLICATION: (id: string) => `${API_URL}/api/government/applications/${id}`,
    UPDATE_STATUS: (id: string) => `${API_URL}/api/government/applications/${id}/status`,
    STATS: `${API_URL}/api/government/stats`,
    DEPARTMENT_STATS: `${API_URL}/api/government/departments/stats`,
  },
  
  // System settings endpoints
  SETTINGS: {
    LIST: `${API_URL}/api/settings`,
    GET: (key: string) => `${API_URL}/api/settings/${key}`,
    UPDATE: (key: string) => `${API_URL}/api/settings/${key}`,
    HEALTH_METRICS: `${API_URL}/api/settings/health/metrics`,
    LOGS: `${API_URL}/api/settings/logs`,
    TEMPLATES: `${API_URL}/api/settings/templates`,
    TEMPLATE: (id: string) => `${API_URL}/api/settings/templates/${id}`,
  },
  
  // Health check
  HEALTH: `${API_URL}/health`,
};

export default API_URL;
