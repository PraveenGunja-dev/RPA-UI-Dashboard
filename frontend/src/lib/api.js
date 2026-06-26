import axios from 'axios';

// Use Vite's BASE_URL (set in config) or default to /
const VITE_BASE = import.meta.env.BASE_URL || '/';
const API_BASE_URL = VITE_BASE.endsWith('/') ? `${VITE_BASE}api` : `${VITE_BASE}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Summary
export const getOrgSummary = () => api.get('/summary');

// Departments
export const getDepartments = () => api.get('/departments');
export const getDepartmentSummary = (id) => api.get(`/departments/${id}/summary`);
export const getDepartmentBots = (id) => api.get(`/departments/${id}/bots`);

// Bots
export const getAllBots = (params = {}) => api.get('/bots', { params });
export const getBotDetail = (id) => api.get(`/bots/${id}`);
export const getBotRuns = (id, limit = 20) => api.get(`/bots/${id}/runs`, { params: { limit } });

// SPOCs
export const getSPOCs = () => api.get('/spocs');
export const getSPOCDetail = (id) => api.get(`/spocs/${id}`);
export const getOrganisation = () => api.get('/organisation');

// Upload
export const uploadMasterFile = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload-master', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const uploadDailyReport = (file, reportDate = null) => {
    const formData = new FormData();
    formData.append('file', file);
    const params = reportDate ? { report_date: reportDate } : {};
    return api.post('/upload-daily-report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params,
    });
};

// Visit Counter
export const getVisitCount = () => api.get('/visits/count');
export const incrementVisitCount = () => api.post('/visits/increment');

// Integration
export const syncSharePoint = () => api.post('/integration/sync-sharepoint');
export const getDailyStats = () => api.get('/integration/daily-stats');
export const getFteTrend = (deptId = null, cumulative = false) => api.get('/integration/fte-trend', { params: { department_id: deptId, cumulative } });
export const getDailyTrend = (deptId = null) => api.get('/integration/daily-trend', { params: { department_id: deptId } });

export default api;
