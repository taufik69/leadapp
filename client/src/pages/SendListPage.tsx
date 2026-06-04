import { useEffect, useRef, useState, useCallback } from 'react';
import { Download, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import SendListTable from '../components/leads/SendListTable';
import Spinner from '../components/ui/Spinner';
import { getAllLeads } from '../api/leads';
import { exportLeadsToCsv } from '../utils/exportCsv';
import type { Lead } from '../types/lead';

type FilterKey = 'all' | 'wa-sent' | 'wa-failed' | 'sms-sent' | 'sms-failed' | 'pending';

const filterFn: Record<FilterKey, (l: Lead) => boolean> = {
  all: () => true,
  'wa-sent': (l) => l.whatsappStatus === 'SENT',
  'wa-failed': (l) => l.whatsappStatus === 'FAILED',
  'sms-sent': (l) => l.smsStatus === 'SENT',
  'sms-failed': (l) => l.smsStatus === 'FAILED',
  pending: (l) => l.whatsappStatus === 'PENDING' || l.smsStatus === 'PENDING',
};

const tabLabels: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'wa-sent', label: 'WA Sent' },
  { key: 'wa-failed', label: 'WA Failed' },
  { key: 'sms-sent', label: 'SMS Sent' },
  { key: 'sms-failed', label: 'SMS Failed' },
  { key: 'pending', label: 'Pending' },
];

const tabStatusColor: Record<FilterKey, string> = {
  all: 'bg-gray-100 text-gray-700',
  'wa-sent': 'bg-green-100 text-green-700',
  'wa-failed': 'bg-red-100 text-red-700',
  'sms-sent': 'bg-green-100 text-green-700',
  'sms-failed': 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

function searchFilter(lead: Lead, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    lead.shopName.toLowerCase().includes(lower) ||
    (lead.ownerName?.toLowerCase().includes(lower) ?? false) ||
    (lead.phoneNumber?.includes(lower) ?? false) ||
    (lead.whatsappNumber?.includes(lower) ?? false)
  );
}

export default function SendListPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterKey>('all');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLeads = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAllLeads();
      setLeads(data);
      setLastUpdated(new Date());
    } catch {
      toast.error('Failed to load leads');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchLeads(true), 5000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, fetchLeads]);

  const filtered = leads.filter((l) => filterFn[activeTab](l) && searchFilter(l, search));
  const countFor = (key: FilterKey) => leads.filter(filterFn[key]).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Send List</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track delivery status for every lead.
            {lastUpdated && (
              <span className="ml-2 text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <div
              onClick={() => setAutoRefresh((v) => !v)}
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors cursor-pointer ${autoRefresh ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${autoRefresh ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            Auto-refresh (5s)
          </label>
          <button
            onClick={() => fetchLeads()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          <button
            onClick={() => exportLeadsToCsv(filtered)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by shop, owner, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabLabels.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === key
                ? `${tabStatusColor[key]} ring-2 ring-offset-1 ring-current`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${activeTab === key ? 'bg-white/60' : 'bg-gray-200 text-gray-600'}`}>
              {countFor(key)}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <SendListTable data={filtered} />
      )}
    </div>
  );
}
