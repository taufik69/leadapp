import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateLead, type UpdateLeadInput } from '../../api/leads';
import type { Lead } from '../../types/lead';

interface Props {
  lead: Lead | null;
  onClose: () => void;
  onSaved: (updated: Lead) => void;
}

const field = (
  label: string,
  value: string,
  onChange: (v: string) => void,
  opts?: { required?: boolean; type?: string; placeholder?: string; textarea?: boolean }
) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label}{opts?.required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {opts?.textarea ? (
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={opts.placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
    ) : (
      <input
        type={opts?.type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={opts?.placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    )}
  </div>
);

export default function EditLeadModal({ lead, onClose, onSaved }: Props) {
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [city, setCity] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lead) return;
    setShopName(lead.shopName);
    setOwnerName(lead.ownerName ?? '');
    setPhoneNumber(lead.phoneNumber ?? '');
    setWhatsappNumber(lead.whatsappNumber ?? '');
    setShopAddress(lead.shopAddress ?? '');
    setCity(lead.city ?? '');
    setWhatsappMessage(lead.whatsappMessage ?? '');
  }, [lead]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = async () => {
    if (!lead || !shopName.trim()) {
      toast.error('Shop name is required');
      return;
    }
    setSaving(true);
    try {
      const payload: UpdateLeadInput = {
        shopName: shopName.trim(),
        ownerName: ownerName.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
        whatsappNumber: whatsappNumber.trim() || null,
        shopAddress: shopAddress.trim() || null,
        city: city.trim() || null,
        whatsappMessage: whatsappMessage,
      };
      const updated = await updateLead(lead.id, payload);
      onSaved(updated);
      toast.success('Lead updated');
      onClose();
    } catch {
      toast.error('Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const open = lead !== null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Edit Lead</h3>
              <p className="text-xs text-gray-500 mt-0.5">{lead?.shopName}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            {field('Shop Name', shopName, setShopName, { required: true, placeholder: 'e.g. Rahim Store' })}

            <div className="grid grid-cols-2 gap-3">
              {field('Owner Name', ownerName, setOwnerName, { placeholder: 'e.g. Rahim' })}
              {field('City', city, setCity, { placeholder: 'e.g. Dhaka' })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {field('Phone Number', phoneNumber, setPhoneNumber, { placeholder: '01XXXXXXXXX' })}
              {field('WhatsApp Number', whatsappNumber, setWhatsappNumber, { placeholder: '01XXXXXXXXX' })}
            </div>

            {field('Shop Address', shopAddress, setShopAddress, { placeholder: 'Full address...' })}

            {field('WhatsApp Message', whatsappMessage, setWhatsappMessage, {
              textarea: true,
              placeholder: 'Custom message sent to this lead via WhatsApp…',
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
