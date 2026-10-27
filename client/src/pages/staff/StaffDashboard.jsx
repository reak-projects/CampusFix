import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  MapPin,
  Check,
  Play,
  CheckSquare,
} from 'lucide-react';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [departmentIssues, setDepartmentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assigned');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const [assignedRes, deptRes] = await Promise.all([
        api.get('/issues?mine=true&limit=20'),
        api.get('/issues?department=mine&limit=20'),
      ]);

      setAssignedIssues(assignedRes.data.issues || []);
      setDepartmentIssues(deptRes.data.issues || []);
    } catch (err) {
      console.error('Error fetching staff dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatus = async (issueId, nextStatus, note) => {
    try {
      await api.patch(`/issues/${issueId}/status`, {
        status: nextStatus,
        note: note || `Updated by ${user?.name}`,
      });
      setToast({ type: 'success', message: `Ticket advanced to ${nextStatus}.` });
      fetchStaffData();
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update status.',
      });
    }
  };

  const totalAssigned = assignedIssues.length;
  const pendingAck = assignedIssues.filter((i) => i.status === 'Reported').length;
  const inProgress = assignedIssues.filter((i) => i.status === 'In Progress' || i.status === 'Acknowledged').length;
  const resolvedCount = assignedIssues.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length;

  const currentList = activeTab === 'assigned' ? assignedIssues : departmentIssues;
  const filteredList = statusFilter === 'All'
    ? currentList
    : currentList.filter((i) => i.status === statusFilter);

  return (
    <div className="space-y-6">
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> Staff Operations Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-white">
            Welcome, {user?.name}!
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Triage your assigned campus tickets, update real-time progress, and execute resolution workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/issues"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/15"
          >
            Explore All Campus Issues
          </Link>
        </div>
      </div>

      {/* Workload KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned to Me"
          value={totalAssigned}
          icon={CheckSquare}
          color="indigo"
          subtitle="Total assigned tickets"
        />
        <StatCard
          title="Needs Acknowledgment"
          value={pendingAck}
          icon={AlertCircle}
          color="rose"
          subtitle="Awaiting first review"
        />
        <StatCard
          title="In Progress"
          value={inProgress}
          icon={Clock}
          color="amber"
          subtitle="Work actively underway"
        />
        <StatCard
          title="Resolved by Me"
          value={resolvedCount}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Fixed and completed"
        />
      </div>

      {/* Workload Queue Tabs and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('assigned')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'assigned'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              My Assigned Workload ({assignedIssues.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('department')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'department'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Department Queue ({departmentIssues.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : filteredList.length === 0 ? (
            <EmptyState
              title={activeTab === 'assigned' ? 'No assigned tickets found' : 'No department tickets'}
              description={
                activeTab === 'assigned'
                  ? 'You currently have no issues assigned matching your filter criteria. Great job!'
                  : 'No tickets currently queued in your department.'
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredList.map((issue) => (
                <div
                  key={issue._id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-xl transition"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {issue.ticketNumber}
                      </span>
                      <StatusBadge status={issue.status} size="sm" />
                      <PriorityBadge priority={issue.priority} size="sm" />
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {issue.category}
                      </span>
                    </div>

                    <Link
                      to={`/issues/${issue._id}`}
                      className="text-base font-semibold text-slate-900 hover:text-indigo-600 transition block truncate"
                    >
                      {issue.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {issue.building} {issue.room ? `• ${issue.room}` : ''}
                      </span>
                      <span>
                        Reported {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                      {issue.reportedBy && <span>by {issue.reportedBy.name}</span>}
                    </div>
                  </div>

                  {/* Quick Status Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                    {issue.status === 'Reported' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(issue._id, 'Acknowledged', 'Acknowledged by staff.')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Acknowledge
                      </button>
                    )}

                    {issue.status === 'Acknowledged' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(issue._id, 'In Progress', 'Staff started troubleshooting.')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition"
                      >
                        <Play className="w-3.5 h-3.5" /> Start Work
                      </button>
                    )}

                    {issue.status === 'In Progress' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(issue._id, 'Resolved', 'Problem repaired and verified.')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                      </button>
                    )}

                    <Link
                      to={`/issues/${issue._id}`}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      Open Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
