import { useEffect, useRef, useState, useCallback } from "react";
import { Download, RefreshCw, Search } from "lucide-react";
import toast from "react-hot-toast";
import SendListTable from "../components/leads/SendListTable";
import ConversationDrawer from "../components/leads/ConversationDrawer";
import EditLeadModal from "../components/leads/EditLeadModal";
import Spinner from "../components/ui/Spinner";
import Modal from "../components/ui/Modal";
import { getAllLeads, getLeadMessages, deleteLead } from "../api/leads";
import { exportLeadsToCsv } from "../utils/exportCsv";
import { useWhatsAppSSE } from "../hooks/useWhatsAppSSE";
import type { Lead, WhatsAppMessage } from "../types/lead";

type FilterKey =
  | "all"
  | "wa-sent"
  | "wa-failed"
  | "sms-sent"
  | "sms-failed"
  | "pending";

const filterFn: Record<FilterKey, (l: Lead) => boolean> = {
  all: () => true,
  "wa-sent": (l) => l.whatsappStatus === "SENT",
  "wa-failed": (l) => l.whatsappStatus === "FAILED",
  "sms-sent": (l) => l.smsStatus === "SENT",
  "sms-failed": (l) => l.smsStatus === "FAILED",
  pending: (l) => l.whatsappStatus === "PENDING" || l.smsStatus === "PENDING",
};

const tabLabels: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "wa-sent", label: "WA Sent" },
  { key: "wa-failed", label: "WA Failed" },
  { key: "sms-sent", label: "SMS Sent" },
  { key: "sms-failed", label: "SMS Failed" },
  { key: "pending", label: "Pending" },
];

const tabStatusColor: Record<FilterKey, string> = {
  all: "bg-gray-100 text-gray-700",
  "wa-sent": "bg-green-100 text-green-700",
  "wa-failed": "bg-red-100 text-red-700",
  "sms-sent": "bg-green-100 text-green-700",
  "sms-failed": "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
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
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterKey>("all");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Conversation drawer
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newReplies, setNewReplies] = useState<Set<string>>(new Set());

  // Edit modal
  const [editLead, setEditLead] = useState<Lead | null>(null);

  // Delete confirmation
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchLeads = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAllLeads();
      setLeads(data);
      setLastUpdated(new Date());
    } catch {
      toast.error("Failed to load leads");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchLeads(true), 5000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchLeads]);

  // --- Conversation drawer ---
  const openChat = useCallback(async (lead: Lead) => {
    setActiveLead(lead);
    setMessages([]);
    setMessagesLoading(true);
    setNewReplies((prev) => {
      const n = new Set(prev);
      n.delete(lead.id);
      return n;
    });
    try {
      setMessages(await getLeadMessages(lead.id));
    } catch {
      toast.error("Failed to load conversation");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const closeChat = useCallback(() => setActiveLead(null), []);

  const handleMessageSent = useCallback((msg: WhatsAppMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // SSE — real-time incoming replies
  useWhatsAppSSE(
    useCallback(
      ({ leadId, message }) => {
        setActiveLead((current) => {
          if (current?.id === leadId) {
            // Guard: don't add if a message with this id is already in the list
            setMessages((prev) =>
              prev.some((m) => m.id === message.id) ? prev : [...prev, message],
            );
          } else {
            setNewReplies((prev) => new Set(prev).add(leadId));
            toast(
              `New reply from ${leads.find((l) => l.id === leadId)?.shopName ?? "a lead"}`,
              { icon: "💬" },
            );
          }
          return current;
        });
      },
      [leads],
    ),
  );

  // --- Edit ---
  const handleEditSaved = useCallback((updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    // Update drawer if open for same lead
    setActiveLead((cur) => (cur?.id === updated.id ? updated : cur));
  }, []);

  // --- Delete ---
  const handleDeleteConfirm = async () => {
    if (!deletingLead) return;
    setDeleteLoading(true);
    try {
      await deleteLead(deletingLead.id);
      setLeads((prev) => prev.filter((l) => l.id !== deletingLead.id));
      if (activeLead?.id === deletingLead.id) closeChat();
      toast.success(`"${deletingLead.shopName}" deleted`);
    } catch {
      toast.error("Failed to delete lead");
    } finally {
      setDeleteLoading(false);
      setDeletingLead(null);
    }
  };

  const filtered = leads.filter(
    (l) => filterFn[activeTab](l) && searchFilter(l, search),
  );
  const countFor = (key: FilterKey) => leads.filter(filterFn[key]).length;

  return (
    <div className="space-y-5 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-1">
      {/* Page header */}
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
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors cursor-pointer ${autoRefresh ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${autoRefresh ? "translate-x-4" : "translate-x-0.5"}`}
              />
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search shop, owner, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {tabLabels.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === key
                ? `${tabStatusColor[key]} ring-2 ring-offset-1 ring-current`
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${activeTab === key ? "bg-white/60" : "bg-gray-200 text-gray-600"}`}
            >
              {countFor(key)}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <SendListTable
          data={filtered}
          newReplies={newReplies}
          onChat={openChat}
          onEdit={setEditLead}
          onDelete={setDeletingLead}
        />
      )}

      {/* Conversation drawer */}
      <ConversationDrawer
        lead={activeLead}
        messages={messages}
        loading={messagesLoading}
        onClose={closeChat}
        onMessageSent={handleMessageSent}
      />

      {/* Edit modal */}
      <EditLeadModal
        lead={editLead}
        onClose={() => setEditLead(null)}
        onSaved={handleEditSaved}
      />

      {/* Delete confirmation */}
      <Modal
        open={deletingLead !== null}
        title="Delete Lead"
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingLead(null)}
      >
        Are you sure you want to delete{" "}
        <strong>{deletingLead?.shopName}</strong>? This will also remove all
        conversation history. This action cannot be undone.
      </Modal>
    </div>
  );
}
