import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import {
  PlusCircle,
  FileText,
  CheckCircle2,
  Clock,
  ThumbsUp,
  MapPin,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myTotal: 0,
    myResolved: 0,
    myActive: 0,
    totalCampus: 0,
  });
  const [myIssues, setMyIssues] = useState([]);
  const [campusIssues, setCampusIssues] = useState([]);
  const [activeTab, setActiveTab] = useState('mine');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch student's own issues
      const myRes = await api.get('/issues?mine=true&limit=6');
      const allRes = await api.get('/issues?limit=6');

      const myIssuesList = myRes.data.issues || [];
      const campusIssuesList = allRes.data.issues || [];

      setMyIssues(myIssuesList);
      setCampusIssues(campusIssuesList);

      const resolved = myIssuesList.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length;
      const active = myIssuesList.filter((i) => i.status !== 'Resolved' && i.status !== 'Closed').length;

      setStats({
        myTotal: myRes.data.total || 0,
        myResolved: resolved,
        myActive: active,
        totalCampus: allRes.data.total || 0,
      });
    } catch (err) {
      console.error('Error fetching student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (e, issueId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.post(`/issues/${issueId}/vote`);
      const { hasVoted, votesCount } = res.data;

      const updateList = (list) =>
        list.map((issue) =>
          issue._id === issueId
            ? { ...issue, hasVoted, votesCount }
            : issue
        );

      setMyIssues(updateList);
      setCampusIssues(updateList);
    } catch (err) {
      console.error('Error toggling vote:', err);
    }
  };

  const displayList = activeTab === 'mine' ? myIssues : campusIssues;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-navy-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Student Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-white">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-sm text-indigo-100/80 mt-1 max-w-xl">
            Spot a maintenance or infrastructure problem on campus? Report it immediately to alert campus facilities and monitor resolution progress in real time.
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-900 font-semibold text-sm hover:bg-indigo-50 shadow-md transition flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-indigo-600" />
          Report an Issue
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Reported Issues"
          value={stats.myTotal}
          icon={FileText}
          color="indigo"
          subtitle="Total tickets submitted"
        />
        <StatCard
          title="Active Issues"
          value={stats.myActive}
          icon={Clock}
          color="amber"
          subtitle="In triage or progress"
        />
        <StatCard
          title="Resolved"
          value={stats.myResolved}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Fixed problems"
        />
        <StatCard
          title="Campus Reports"
          value={stats.totalCampus}
          icon={TrendingUp}
          color="sky"
          subtitle="Active community tickets"
        />
      </div>

      {/* Issues Feed Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('mine')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'mine'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              My Reported Issues ({myIssues.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('campus')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'campus'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Recent Campus Feed
            </button>
          </div>

          <Link
            to="/issues"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-end sm:self-auto"
          >
            Explore all campus issues <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : displayList.length === 0 ? (
            <EmptyState
              title={activeTab === 'mine' ? 'No issues reported yet' : 'No campus issues found'}
              description={
                activeTab === 'mine'
                  ? "You haven't reported any problems on campus yet. If you see broken facilities or Wi-Fi drops, submit a ticket!"
                  : 'Everything seems clear on campus right now.'
              }
              actionLabel={activeTab === 'mine' ? 'Report First Issue' : undefined}
              onAction={activeTab === 'mine' ? () => (window.location.href = '/report') : undefined}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {displayList.map((issue) => (
                <div
                  key={issue._id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 p-3 rounded-xl transition"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-slate-500">
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
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {issue.building} {issue.room ? `• ${issue.room}` : ''}
                      </span>
                      <span>
                        Reported {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                      {issue.reportedBy && (
                        <span>by {issue.reportedBy.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => handleVote(e, issue._id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        issue.hasVoted
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                      }`}
                      title={issue.hasVoted ? 'Click to remove upvote' : 'Upvote this issue to show demand'}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${issue.hasVoted ? 'fill-indigo-600' : ''}`} />
                      <span>{issue.votesCount || 0}</span>
                    </button>

                    <Link
                      to={`/issues/${issue._id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-xs font-medium text-slate-700 transition"
                    >
                      View Details
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
