export interface EmailJobData {
  leadId: string;
  email: string;
  shopName: string;
  ownerName?: string | null;
  phoneNumber?: string | null;
}

export interface WhatsAppJobData {
  leadId: string;
  phoneNumber: string;
  shopName: string;
  ownerName?: string | null;
}
