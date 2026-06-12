import axios from 'axios';
import type { Lead, BulkLeadPayload, BulkCreateResponse, WhatsAppMessage } from '../types/lead';

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

export const getLeadMessages = async (leadId: string): Promise<WhatsAppMessage[]> => {
  const res = await api.get<{ data: WhatsAppMessage[] }>(`/api/v1/leads/${leadId}/messages`);
  return res.data.data;
};

export const sendReplyWhatsApp = async (leadId: string, message: string): Promise<WhatsAppMessage> => {
  const res = await api.post<{ data: WhatsAppMessage }>(`/api/v1/leads/${leadId}/whatsapp`, { message });
  return res.data.data;
};

export const deleteLead = async (id: string): Promise<void> => {
  await api.delete(`/api/v1/leads/${id}`);
};

export interface UpdateLeadInput {
  shopName?: string;
  ownerName?: string | null;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  shopAddress?: string | null;
  city?: string | null;
  whatsappMessage?: string;
}

export const updateLead = async (id: string, data: UpdateLeadInput): Promise<Lead> => {
  const res = await api.patch<{ data: Lead }>(`/api/v1/leads/${id}`, data);
  return res.data.data;
};

export const WA_SSE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/v1/whatsapp/stream`;
