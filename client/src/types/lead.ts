export type MessageStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface Lead {
  id: string;
  shopName: string;
  ownerName: string | null;
  shopAddress: string | null;
  city: string | null;
  photoUrl: string | null;
  facebookPage: string | null;
  instagramPage: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  email: string | null;
  website: string | null;
  emailStatus: MessageStatus;
  emailMessage: string;
  emailSentAt: string | null;
  whatsappStatus: MessageStatus;
  whatsappMessage: string;
  whatsappSentAt: string | null;
  smsStatus: MessageStatus;
  smsMessage: string;
  smsSentAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadInput {
  shopName: string;
  ownerName?: string | null;
  shopAddress?: string | null;
  city?: string | null;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  website?: string | null;
  facebookPage?: string | null;
  instagramPage?: string | null;
}

export interface BulkLeadPayload {
  leads: LeadInput[];
  whatsappMessage?: string;
  smsMessage?: string;
}

export interface BulkCreateResponse {
  created: number;
  skipped: number;
  leads: Lead[];
}
