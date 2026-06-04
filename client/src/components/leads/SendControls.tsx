import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';
import Modal from '../ui/Modal';
import { bulkCreateLeads } from '../../api/leads';
import type { LeadInput } from '../../types/lead';

interface SendControlsProps {
  leads: LeadInput[];
  isJsonValid: boolean;
  whatsappMessage: string;
  smsMessage: string;
}

export default function SendControls({ leads, isJsonValid, whatsappMessage, smsMessage }: SendControlsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const waCount = leads.filter((l) => l.whatsappNumber || l.phoneNumber).length;
  const smsCount = leads.filter((l) => l.phoneNumber).length;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await bulkCreateLeads({
        leads,
        whatsappMessage: whatsappMessage || undefined,
        smsMessage: smsMessage || undefined,
      });
      toast.success(`${result.created} leads queued${result.skipped > 0 ? `, ${result.skipped} skipped` : ''}`);
      setOpen(false);
      navigate('/send-list');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit leads';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-sm text-gray-600 space-y-0.5">
          <p>
            <span className="font-semibold text-green-700">{waCount}</span> leads will receive <span className="font-medium">WhatsApp</span>
          </p>
          <p>
            <span className="font-semibold text-blue-700">{smsCount}</span> leads will receive <span className="font-medium">SMS</span>
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          disabled={!isJsonValid || leads.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={15} />
          Send to All
        </button>
      </div>

      <Modal
        open={open}
        title="Confirm Batch Send"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
        confirmLabel="Send Now"
        loading={loading}
      >
        <p>You are about to:</p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
          <li>Send <strong>WhatsApp</strong> to <strong>{waCount}</strong> number{waCount !== 1 ? 's' : ''}</li>
          <li>Send <strong>SMS</strong> to <strong>{smsCount}</strong> number{smsCount !== 1 ? 's' : ''}</li>
        </ul>
        <p className="mt-3 text-sm text-gray-500">Messages will be queued and processed by the worker. Proceed?</p>
      </Modal>
    </>
  );
}
