import { useEffect, useState, useCallback } from "react";
import {
  Users,
  MessageSquare,
  Phone,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import { getAllLeads } from "../api/leads";
import type { Lead } from "../types/lead";

interface Stats {
  total: number;
  waSent: number;
  waFailed: number;
  waPending: number;
  smsSent: number;
  smsFailed: number;
  smsPending: number;
  recentFailures: Lead[];
}

function calcStats(leads: Lead[]): Stats {
  return {
    total: leads.length,
    waSent: leads.filter((l) => l.whatsappStatus === "SENT").length,
    waFailed: leads.filter((l) => l.whatsappStatus === "FAILED").length,
    waPending: leads.filter((l) => l.whatsappStatus === "PENDING").length,
    smsSent: leads.filter((l) => l.smsStatus === "SENT").length,
    smsFailed: leads.filter((l) => l.smsStatus === "FAILED").length,
    smsPending: leads.filter((l) => l.smsStatus === "PENDING").length,
    recentFailures: leads
      .filter((l) => l.whatsappStatus === "FAILED" || l.smsStatus === "FAILED")
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 5),
  };
}

function BarRow({
  label,
  sent,
  failed,
  pending,
  total,
}: {
  label: string;
  sent: number;
  failed: number;
  pending: number;
  total: number;
}) {
  if (total === 0) return null;
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs text-gray-400">
          {sent} sent · {failed} failed · {pending} pending
        </span>
      </div>
      <div className="flex h-5 rounded-full overflow-hidden bg-gray-100">
        {sent > 0 && (
          <div
            style={{ width: pct(sent) }}
            className={`bg-green-500 transition-all`}
            title={`Sent: ${sent}`}
          />
        )}
        {failed > 0 && (
          <div
            style={{ width: pct(failed) }}
            className="bg-red-400 transition-all"
            title={`Failed: ${failed}`}
          />
        )}
        {pending > 0 && (
          <div
            style={{ width: pct(pending) }}
            className="bg-yellow-300 transition-all"
            title={`Pending: ${pending}`}
          />
        )}
      </div>
      <div className="flex gap-3 mt-1 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
          Sent
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
          Failed
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-yellow-300 inline-block" />
          Pending
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const leads = await getAllLeads();
      setStats(calcStats(leads));
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Delivery health overview</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {stats.total === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
          <p className="text-gray-400 text-sm">No leads yet.</p>
          <Link
            to="/send"
            className="mt-3 inline-flex items-center gap-1 text-blue-600 text-sm hover:underline"
          >
            Go to Send <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card
              title="Total Leads"
              value={stats.total}
              color="blue"
              icon={<Users size={20} />}
            />
            <Card
              title="WhatsApp Sent"
              value={stats.waSent}
              color="green"
              icon={<MessageSquare size={20} />}
            />
            <Card
              title="WhatsApp Failed"
              value={stats.waFailed}
              color="red"
              icon={<MessageSquare size={20} />}
            />
            <Card
              title="SMS Sent"
              value={stats.smsSent}
              color="green"
              icon={<Phone size={20} />}
            />
            <Card
              title="SMS Failed"
              value={stats.smsFailed}
              color="red"
              icon={<Phone size={20} />}
            />
            <Card
              title="Pending"
              value={Math.max(stats.waPending, stats.smsPending)}
              color="yellow"
              icon={<AlertTriangle size={20} />}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-900">
              Delivery Summary
            </h2>
            <BarRow
              label="WhatsApp"
              sent={stats.waSent}
              failed={stats.waFailed}
              pending={stats.waPending}
              total={stats.total}
            />
            <BarRow
              label="SMS"
              sent={stats.smsSent}
              failed={stats.smsFailed}
              pending={stats.smsPending}
              total={stats.total}
            />
          </div>

          {stats.recentFailures.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Recent Failures
                </h2>
                <Link
                  to="/send-list"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight size={11} />
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {stats.recentFailures.map((lead) => (
                  <div
                    key={lead.id}
                    className="py-3 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.shopName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {lead.phoneNumber ?? lead.whatsappNumber ?? "—"}
                      </p>
                      {lead.lastError && (
                        <p className="text-xs text-red-500 mt-0.5 max-w-xs truncate">
                          {lead.lastError}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0 mt-0.5">
                      {lead.whatsappStatus === "FAILED" && (
                        <Badge status="FAILED" />
                      )}
                      {lead.smsStatus === "FAILED" && <Badge status="FAILED" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
