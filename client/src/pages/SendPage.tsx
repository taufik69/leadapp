import { useState } from 'react';
import JsonInputPanel from '../components/leads/JsonInputPanel';
import MessagePanel from '../components/leads/MessagePanel';
import SendControls from '../components/leads/SendControls';
import type { LeadInput } from '../types/lead';

export default function SendPage() {
  const [leads, setLeads] = useState<LeadInput[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [smsMessage, setSmsMessage] = useState('');

  const handleValidation = (parsed: LeadInput[], valid: boolean) => {
    setLeads(parsed);
    setIsValid(valid);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send Messages</h1>
        <p className="text-sm text-gray-500 mt-1">Paste a JSON array of leads, write your messages, and send in bulk.</p>
      </div>

      <JsonInputPanel onValidation={handleValidation} />
      <MessagePanel
        whatsappMessage={whatsappMessage}
        smsMessage={smsMessage}
        onWhatsappChange={setWhatsappMessage}
        onSmsChange={setSmsMessage}
      />
      <SendControls
        leads={leads}
        isJsonValid={isValid}
        whatsappMessage={whatsappMessage}
        smsMessage={smsMessage}
      />
    </div>
  );
}
