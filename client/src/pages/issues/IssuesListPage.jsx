import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import {
  Search,
  Filter,
  MapPin,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  SlidersHorizontal,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Wi-Fi',
  'Laboratory',
  'Classrooms',
  'Hostels',
  'Cleanliness',
  'Electricity',
  'Other',
];

const STATUSES = ['All', 'Reported', 'Acknowledged', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Critical'];

export default function IssuesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters state from URL or defaults
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'All');
  const [mine, setMine] = useState(searchParams.get('mine') === 'true');
  const [department, setDepartment] = useState(searchParams.get('department') || '');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  const searchDebounceRef = useRef(null);

  useEffect(() => {
    fetchIssues();
  }, [page, category, status, priority, mine, department, sortBy, order]);

  // Debounced text search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      fetchIssues();
    }, 350);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (search.trim()) params.append('search', search.trim());
      if (category !== 'All') params.append('category', category);
      if (status !== 'All') params.append('status', status);
      if (priority !== 'All') params.append('priority', priority);
      if (mine) params.append('mine', 'true');
      if (department) params.append('department', department);
      params.append('sort', sortBy);
      params.append('order', order);

      const res = await api.get(`/issues?${params.toString()}`);
      setIssues(res.data.issues || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error('Error fetching issues:', err);
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
      setIssues((prev) =>
        prev.map((i) => (i._id === issueId ? { ...i, hasVoted, votesCount } : i))
      );
    } catch (err) {
      console.error('Error voting on issue:', err);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setStatus('All');
    setPriority('All');
    setMine(false);
    setDepartment('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Issues Feed</h1>
          <p className="text-sm text-slate-500">
            Browse, search, and track resolution status across all campus departments
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Report New Issue
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket #, title, building, or room..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition bg-white"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Statuses' : s}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition bg-white"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p === 'All' ? 'All Priorities' : `${p} Priority`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMine(!mine);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg border font-medium transition ${
                mine
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {mine ? '✓ Filtering: My Tickets' : 'Filter: My Tickets Only'}
            </button>

            {(search || category !== 'All' || status !== 'All' || priority !== 'All' || mine) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-slate-500 hover:text-rose-600 underline"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort:</span>
            <select
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [sort, ord] = e.target.value.split('-');
                setSortBy(sort);
                setOrder(ord);
              }}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="priority-desc">Priority</option>
            </select>

            <span className="text-slate-500 font-medium ml-2">
              Showing {issues.length} of {total} issues
            </span>
          </div>
        </div>
      </div>

      {/* Issues List Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={4} />
          </div>
        ) : issues.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No issues found matching your filters"
              description="Try adjusting your search criteria, selecting a different category, or clearing filters."
              actionLabel="Reset All Filters"
              onAction={clearFilters}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {issues.map((issue) => (
              <div
                key={issue._id}
                className="p-5 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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

                  <p className="text-xs text-slate-600 line-clamp-1">
                    {issue.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {issue.building} {issue.floor ? `• ${issue.floor}` : ''} {issue.room ? `• ${issue.room}` : ''}
                    </span>
                    <span>
                      Reported {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                    {issue.reportedBy && (
                      <span>by {issue.reportedBy.name}</span>
                    )}
                    {issue.assignedTo && (
                      <span className="text-indigo-600 font-medium">
                        Assigned: {issue.assignedTo.name}
                      </span>
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
                    title={issue.hasVoted ? 'Remove upvote' : 'Upvote issue'}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${issue.hasVoted ? 'fill-indigo-600' : ''}`} />
                    <span>{issue.votesCount || 0}</span>
                  </button>

                  <Link
                    to={`/issues/${issue._id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
