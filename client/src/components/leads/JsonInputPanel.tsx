import { useRef, useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileJson } from 'lucide-react';
import type { LeadInput } from '../../types/lead';
import { validateLeadJson } from '../../utils/validateLeadJson';

interface JsonInputPanelProps {
  onValidation: (leads: LeadInput[], valid: boolean) => void;
}

const PLACEHOLDER = `[
  {
    "shopName": "Example Shop",
    "ownerName": "Rahim",
    "phoneNumber": "01712345678",
    "whatsappNumber": "01712345678",
    "city": "Dhaka"
  }
]`;

export default function JsonInputPanel({ onValidation }: JsonInputPanelProps) {
  const [raw, setRaw] = useState('');
  const [status, setStatus] = useState<'idle' | 'valid' | 'error'>('idle');
  const [errors, setErrors] = useState<string[]>([]);
  const [leads, setLeads] = useState<LeadInput[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleValidate = () => {
    const result = validateLeadJson(raw);
    setStatus(result.valid ? 'valid' : 'error');
    setErrors(result.errors);
    setLeads(result.leads);
    onValidation(result.leads, result.valid);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRaw(text);
      setStatus('idle');
      setErrors([]);
      setLeads([]);
      onValidation([], false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleChange = (val: string) => {
    setRaw(val);
    setStatus('idle');
    setErrors([]);
    onValidation([], false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileJson size={18} className="text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">Paste Lead JSON Array</h2>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Upload size={14} />
          Upload JSON File
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
      </div>

      <textarea
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={10}
        className="w-full font-mono text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-gray-50"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={handleValidate}
          disabled={!raw.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Validate JSON
        </button>
        {status === 'valid' && (
          <span className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
            <CheckCircle size={15} /> {leads.length} records ready
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
            <AlertCircle size={15} /> {errors.length} error{errors.length > 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {status === 'error' && errors.length > 0 && (
        <ul className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1 text-sm text-red-700">
          {errors.map((e, i) => <li key={i}>• {e}</li>)}
        </ul>
      )}

      {status === 'valid' && leads.length > 0 && (
        <div className="overflow-x-auto">
          <p className="text-xs text-gray-500 mb-2">Preview (first 5 rows)</p>
          <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                {['Shop Name', 'Owner', 'Phone', 'WhatsApp', 'City'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-gray-600 font-medium border-b border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 5).map((l, i) => {
                const r = l as unknown as Record<string, unknown>;
                const get = (...keys: string[]) => {
                  for (const k of keys) if (r[k]) return String(r[k]);
                  return '—';
                };
                return (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2 text-gray-800">{get('shopName', 'shop_name')}</td>
                  <td className="px-3 py-2 text-gray-600">{get('ownerName', 'owner_name')}</td>
                  <td className="px-3 py-2 text-gray-600">{get('phoneNumber', 'phone_number')}</td>
                  <td className="px-3 py-2 text-gray-600">{get('whatsappNumber', 'whatsapp_number')}</td>
                  <td className="px-3 py-2 text-gray-600">{get('city')}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {leads.length > 5 && (
            <p className="text-xs text-gray-400 mt-1">…and {leads.length - 5} more records</p>
          )}
        </div>
      )}
    </div>
  );
}
