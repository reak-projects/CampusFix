import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Percent,
  Timer,
  ChevronRight,
} from 'lucide-react';

const CATEGORY_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="stats" />
        <LoadingSkeleton count={2} />
      </div>
    );
  }

  const {
    summary = {},
    categoryBreakdown = [],
    statusBreakdown = [],
    monthlyVolume = [],
    locationBreakdown = [],
    staffWorkload = [],
  } = data;

  // Format category data for PieChart
  const pieData = categoryBreakdown.map((item) => ({
    name: item._id || 'Other',
    value: item.count,
  }));

  // Format status data for BarChart
  const statusBarData = statusBreakdown.map((item) => ({
    status: item._id,
    count: item.count,
  }));

  // Format location data
  const locationBarData = locationBreakdown.map((item) => ({
    building: item._id,
    issues: item.count,
  }));

  // Format monthly volume
  const monthlyData = monthlyVolume.map((item) => ({
    period: `${item._id.month}/${item._id.year}`,
    count: item.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-navy-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Operations Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-white">
            Campus Operations Analytics
          </h1>
          <p className="text-sm text-indigo-100/80 mt-1 max-w-xl">
            Live infrastructure diagnostics powered by real-time MongoDB aggregation pipelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" /> Manage Users
          </Link>
          <Link
            to="/admin/departments"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" /> Departments
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Issues"
          value={summary.totalIssues || 0}
          icon={TrendingUp}
          color="indigo"
          subtitle="All reported"
        />
        <StatCard
          title="Open Tickets"
          value={summary.openIssues || 0}
          icon={Clock}
          color="amber"
          subtitle="Pending or active"
        />
        <StatCard
          title="Resolved Tickets"
          value={summary.resolvedIssues || 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Fixed issues"
        />
        <StatCard
          title="Overdue (>7 Days)"
          value={summary.overdueIssues || 0}
          icon={AlertTriangle}
          color="rose"
          subtitle="Needs escalation"
        />
        <StatCard
          title="Resolution Rate"
          value={`${summary.resolutionRate || 0}%`}
          icon={Percent}
          color="sky"
          subtitle="Fixed vs reported"
        />
        <StatCard
          title="Avg Resolution"
          value={`${summary.averageResolutionHours || 0}h`}
          icon={Timer}
          color="purple"
          subtitle="Hours to complete"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Issues by Lifecycle Status</h3>
              <p className="text-xs text-slate-400">Current ticket progression stage</p>
            </div>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBarData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Issues by Category</h3>
              <p className="text-xs text-slate-400">Distribution across infrastructure types</p>
            </div>
          </div>
          <div className="h-64 mt-4 flex items-center justify-center">
            {pieData.length === 0 ? (
              <p className="text-xs text-slate-400">No category data recorded</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Complaint Locations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">High-Complaint Campus Buildings</h3>
              <p className="text-xs text-slate-400">Buildings with the highest ticket volume</p>
            </div>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="building" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="issues" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Volume */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Incident Influx</h3>
              <p className="text-xs text-slate-400">Trend of incoming reports over time</p>
            </div>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Staff Workload Diagnostic Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Staff Workload & Performance</h3>
            <p className="text-xs text-slate-400">Distribution of assigned operational responsibilities</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3 rounded-l-lg">Staff Member</th>
                <th className="p-3">Department</th>
                <th className="p-3">Assigned Total</th>
                <th className="p-3">Active Tickets</th>
                <th className="p-3 rounded-r-lg">Resolved Tickets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {staffWorkload.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                    No staff workload data found.
                  </td>
                </tr>
              ) : (
                staffWorkload.map((staff) => (
                  <tr key={staff._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-semibold text-slate-900">
                      {staff.name}
                      <span className="block text-[11px] font-normal text-slate-400">{staff.email}</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      {staff.department || 'General Staff'}
                    </td>
                    <td className="p-3 font-semibold">{staff.assignedIssueCount}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                        {staff.openIssueCount} active
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        {staff.resolvedIssueCount} resolved
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
