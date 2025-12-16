import axios from 'axios';
import { AuditLog, AuditLogQuery, AuditLogStatistics } from '../types/audit';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const auditLogService = {
  async getAuditLogs(params: AuditLogQuery) {
    const response = await axios.get(`${API_BASE_URL}/audit-logs`, { params });
    return response.data;
  },

  async getAuditLog(id: string): Promise<AuditLog> {
    const response = await axios.get(`${API_BASE_URL}/audit-logs/${id}`);
    return response.data;
  },

  async getStatistics(params: {
    startDate?: string;
    endDate?: string;
    entityType?: string;
  }): Promise<AuditLogStatistics> {
    const response = await axios.get(`${API_BASE_URL}/audit-logs/statistics`, { params });
    return response.data;
  },

  async exportLogs(params: AuditLogQuery, format: 'csv' | 'json' = 'json') {
    const response = await axios.get(`${API_BASE_URL}/audit-logs/export`, {
      params: { ...params, format },
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return response.data;
  },

  async deleteOldLogs(beforeDate: string) {
    const response = await axios.delete(`${API_BASE_URL}/audit-logs/cleanup`, {
      params: { beforeDate },
    });
    return response.data;
  },
};