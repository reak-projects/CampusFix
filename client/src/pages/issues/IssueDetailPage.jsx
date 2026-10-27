import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  ThumbsUp,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  RotateCcw,
  ShieldCheck,
  Wrench,
  GraduationCap,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';

const STATUS_STEPS = ['Reported', 'Acknowledged', 'In Progress', 'Resolved', 'Closed'];

export default function IssueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Status transition state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Assignment state (for admin/staff)
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Selected image preview modal
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchIssueDetails();
    if (user?.role === 'admin' || user?.role === 'staff') {
      fetchStaffList();
    }
  }, [id]);

  const fetchIssueDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/issues/${id}`);
      setIssue(res.data.issue);
      setComments(res.data.comments || []);
      if (res.data.issue.assignedTo?._id) {
        setSelectedStaff(res.data.issue.assignedTo._id);
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load issue details.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await api.get('/admin/staff');
      setStaffList(res.data.staff || []);
    } catch {
      // Ignore if non-admin or failed
    }
  };

  const handleVote = async () => {
    try {
      const res = await api.post(`/issues/${id}/vote`);
      setIssue((prev) => ({
        ...prev,
        hasVoted: res.data.hasVoted,
        votesCount: res.data.votesCount,
      }));
      setToast({ type: 'success', message: res.data.message });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to record vote.' });
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setCommentSubmitting(true);
      const res = await api.post(`/issues/${id}/comments`, { message: newComment.trim() });
      setComments((prev) => [...prev, res.data.comment]);
      setNewComment('');
      setToast({ type: 'success', message: 'Comment posted.' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to post comment.' });
    } finally {
      setCommentSubmitting(false);
    }
  };

  const openStatusTransition = (status) => {
    setTargetStatus(status);
    setStatusNote('');
    setStatusModalOpen(true);
  };

  const handleConfirmStatus = async () => {
    try {
      setUpdatingStatus(true);
      const res = await api.patch(`/issues/${id}/status`, {
        status: targetStatus,
        note: statusNote || undefined,
      });
      setIssue(res.data.issue);
      setStatusModalOpen(false);
      setToast({ type: 'success', message: `Status updated to ${targetStatus}.` });
      fetchIssueDetails(); // Refresh full timeline
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update status.',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff) return;
    try {
      setAssigning(true);
      const res = await api.post(`/issues/${id}/assign`, { assigneeId: selectedStaff });
      setIssue(res.data.issue);
      setToast({ type: 'success', message: 'Issue assigned successfully.' });
      fetchIssueDetails();
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to assign issue.',
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteIssue = async () => {
    if (!window.confirm('Are you sure you want to delete this issue report? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/issues/${id}`);
      navigate('/issues');
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to delete issue.' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-xl font-bold text-slate-900">Issue Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          The requested ticket does not exist or has been removed.
        </p>
        <Link
          to="/issues"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Issues
        </Link>
      </div>
    );
  }

  const isReporter = user?._id === issue.reportedBy?._id;
  const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin';
  const currentStepIndex = STATUS_STEPS.indexOf(issue.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      {/* Navigation and Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          {(user?.role === 'admin' || (isReporter && issue.status === 'Reported')) && (
            <button
              type="button"
              onClick={handleDeleteIssue}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Ticket
            </button>
          )}

          <button
            type="button"
            onClick={handleVote}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition ${
              issue.hasVoted
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${issue.hasVoted ? 'fill-indigo-600' : ''}`} />
            <span>{issue.hasVoted ? 'Upvoted' : 'Upvote'}</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-200/70 text-xs">
              {issue.votesCount || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Ticket Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-sm font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {issue.ticketNumber}
          </span>
          <StatusBadge status={issue.status} size="lg" />
          <PriorityBadge priority={issue.priority} size="md" />
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
            {issue.category}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
          {issue.title}
        </h1>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <MapPin className="w-4 h-4 text-indigo-500" />
            {issue.building} {issue.floor ? `• ${issue.floor}` : ''} {issue.room ? `• ${issue.room}` : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            Reported on {new Date(issue.createdAt).toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-400" />
            Reported by {issue.reportedBy?.name || 'Anonymous Student'}
          </span>
        </div>

        {/* Description */}
        <div className="pt-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Problem Description
          </h3>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            {issue.description}
          </p>
        </div>

        {/* Attachments Section */}
        {issue.attachments && issue.attachments.length > 0 && (
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> Photo Attachments ({issue.attachments.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {issue.attachments.map((url, idx) => {
                const fullUrl = url.startsWith('http') ? url : `http://localhost:5001${url}`;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(fullUrl)}
                    className="relative w-28 h-28 rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 hover:shadow-md transition group"
                  >
                    <img src={fullUrl} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition">
                      View full
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Visual Status Progression Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Resolution Workflow Progress</h3>

        {/* Stepper Bar */}
        <div className="relative flex items-center justify-between mb-8">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 w-full z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 transition-all duration-300 z-0"
            style={{
              width: `${(Math.max(0, currentStepIndex) / (STATUS_STEPS.length - 1)) * 100}%`,
            }}
          />

          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isCompleted
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  } ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    isCurrent ? 'text-indigo-700 font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Role Action Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
          {/* Staff / Admin Actions */}
          {isStaffOrAdmin && (
            <>
              {issue.status === 'Reported' && (
                <button
                  type="button"
                  onClick={() => openStatusTransition('Acknowledged')}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  Acknowledge Ticket
                </button>
              )}

              {issue.status === 'Acknowledged' && (
                <button
                  type="button"
                  onClick={() => openStatusTransition('In Progress')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  Start Work (In Progress)
                </button>
              )}

              {issue.status === 'In Progress' && (
                <button
                  type="button"
                  onClick={() => openStatusTransition('Resolved')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  Mark as Resolved
                </button>
              )}

              {issue.status === 'Resolved' && (
                <button
                  type="button"
                  onClick={() => openStatusTransition('Closed')}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  Close Ticket
                </button>
              )}
            </>
          )}

          {/* Student Reporter Reopening Action */}
          {isReporter && (issue.status === 'Resolved' || issue.status === 'Closed') && (
            <button
              type="button"
              onClick={() => openStatusTransition('Reported')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reopen Ticket (Problem Persists)
            </button>
          )}

          {/* Assignee Information / Reassignment Dropdown */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Assigned to:</span>
            {isStaffOrAdmin && staffList.length > 0 ? (
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800"
                >
                  <option value="">Unassigned</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.department?.name || 'Staff'})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={assigning || !selectedStaff || selectedStaff === issue.assignedTo?._id}
                  onClick={handleAssignStaff}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg border border-slate-200 disabled:opacity-40 transition"
                >
                  {assigning ? '...' : 'Assign'}
                </button>
              </div>
            ) : (
              <span className="text-xs font-semibold text-slate-800">
                {issue.assignedTo?.name || 'Unassigned'}
              </span>
            )}
          </div>
        </div>

        {/* Detailed Status History Log */}
        {issue.statusHistory && issue.statusHistory.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Status Change History Log
            </h4>
            <div className="space-y-2">
              {issue.statusHistory.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                >
                  <div>
                    <span className="font-semibold text-slate-800">
                      Status: {entry.status}
                    </span>
                    {entry.note && (
                      <span className="text-slate-600 ml-2 italic">— {entry.note}</span>
                    )}
                  </div>
                  <div className="text-slate-400 text-[11px] flex-shrink-0">
                    by {entry.changedBy?.name || 'User'} ({entry.changedBy?.role || 'staff'}) •{' '}
                    {new Date(entry.changedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Discussion & Progress Updates Thread */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">
            Discussion & Progress Updates ({comments.length})
          </h3>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No comments or progress updates posted yet.
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c._id}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      {c.author?.name || 'User'}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      {c.author?.role || 'student'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {c.message}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Comment input form */}
        <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            required
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a progress update, note, or inquiry..."
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
          <button
            type="submit"
            disabled={commentSubmitting || !newComment.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            Post
          </button>
        </form>
      </div>

      {/* Status Transition Note Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Change Status to "${targetStatus}"`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            {targetStatus === 'Reported'
              ? 'Please describe why the issue is being reopened (e.g., problem still persists, recurring fault):'
              : `Add an optional progress update note for transitioning this ticket to ${targetStatus}:`}
          </p>

          <textarea
            rows={3}
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="e.g. Technician replaced hardware; tested and working."
            className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={updatingStatus}
              onClick={handleConfirmStatus}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm"
            >
              {updatingStatus ? 'Updating...' : `Confirm: ${targetStatus}`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      {selectedImage && (
        <Modal
          isOpen={Boolean(selectedImage)}
          onClose={() => setSelectedImage(null)}
          title="Attachment Preview"
          maxWidth="max-w-3xl"
        >
          <div className="flex justify-center p-2">
            <img
              src={selectedImage}
              alt="Attachment full preview"
              className="max-h-[70vh] rounded-xl object-contain"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
