import type { Lead } from '../types/lead';

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' }) : '';

export function exportLeadsToCsv(leads: Lead[], filename?: string) {
  const headers = [
    'Shop Name', 'Owner', 'Phone', 'WhatsApp Number',
    'WA Status', 'WA Sent At', 'SMS Status', 'SMS Sent At', 'Error',
  ];

  const rows = leads.map((l) => [
    l.shopName,
    l.ownerName ?? '',
    l.phoneNumber ?? '',
    l.whatsappNumber ?? '',
    l.whatsappStatus,
    formatDate(l.whatsappSentAt),
    l.smsStatus,
    formatDate(l.smsSentAt),
    l.lastError ?? '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? `send-list-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
