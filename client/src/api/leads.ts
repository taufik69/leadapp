import axios from 'axios';
import type { Lead, BulkLeadPayload, BulkCreateResponse } from '../types/lead';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

export const getAllLeads = async (): Promise<Lead[]> => {
  const res = await api.get<{ data: Lead[] }>('/api/v1/leads');
  return res.data.data;
};

export const bulkCreateLeads = async (payload: BulkLeadPayload): Promise<BulkCreateResponse> => {
  const res = await api.post<{ data: BulkCreateResponse }>('/api/v1/leads/bulk', payload);
  return res.data.data;
};
