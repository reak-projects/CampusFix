import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Toast from '../../components/common/Toast';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import {
  UploadCloud,
  X,
  AlertTriangle,
  ThumbsUp,
  MapPin,
  Send,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const CATEGORIES = [
  'Wi-Fi',
  'Laboratory',
  'Classrooms',
  'Hostels',
  'Cleanliness',
  'Electricity',
  'Other',
];

const PRIORITIES = [
  { value: 'Low', label: 'Low - Minor inconvenience', color: 'text-slate-600' },
  { value: 'Medium', label: 'Medium - Affects daily routine', color: 'text-amber-600' },
  { value: 'High', label: 'High - Serious disruption', color: 'text-orange-600' },
  { value: 'Critical', label: 'Critical - Safety hazard / complete stoppage', color: 'text-rose-600 font-semibold' },
];

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Wi-Fi',
    building: '',
    floor: '',
    room: '',
    priority: 'Medium',
  });
  const [attachments, setAttachments] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Duplicate issues state
  const [duplicates, setDuplicates] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const duplicateTimeoutRef = useRef(null);

  // Live duplicate detection debounce
  useEffect(() => {
    if (duplicateTimeoutRef.current) {
      clearTimeout(duplicateTimeoutRef.current);
    }

    if (!formData.category && !formData.building && formData.title.length < 3) {
      setDuplicates([]);
      return;
    }

    duplicateTimeoutRef.current = setTimeout(async () => {
      try {
        setCheckingDuplicates(true);
        const params = new URLSearchParams();
        if (formData.category) params.append('category', formData.category);
        if (formData.building) params.append('building', formData.building);
        if (formData.title) params.append('title', formData.title);

        const res = await api.get(`/issues/check-duplicates?${params.toString()}`);
        setDuplicates(res.data.duplicates || []);
      } catch (err) {
        console.error('Error checking duplicate issues:', err);
      } finally {
        setCheckingDuplicates(false);
      }
    }, 450);

    return () => clearTimeout(duplicateTimeoutRef.current);
  }, [formData.category, formData.building, formData.title]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = [];
    const validPreviews = [];

    for (const file of selectedFiles) {
      if (!file.type.startsWith('image/')) {
        setToast({ type: 'error', message: 'Only image files are allowed.' });
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setToast({ type: 'error', message: 'Image size cannot exceed 5MB.' });
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setAttachments((prev) => [...prev, ...validFiles].slice(0, 5));
    setPreviews((prev) => [...prev, ...validPreviews].slice(0, 5));
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVoteDuplicate = async (issueId) => {
    try {
      const res = await api.post(`/issues/${issueId}/vote`);
      setToast({ type: 'success', message: res.data.message });

      setDuplicates((prev) =>
        prev.map((item) =>
          item._id === issueId
            ? { ...item, hasVoted: res.data.hasVoted, votesCount: res.data.votesCount }
            : item
        )
      );
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to vote.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formPayload = new FormData();
      formPayload.append('title', formData.title);
      formPayload.append('description', formData.description);
      formPayload.append('category', formData.category);
      formPayload.append('building', formData.building);
      formPayload.append('floor', formData.floor);
      formPayload.append('room', formData.room);
      formPayload.append('priority', formData.priority);

      attachments.forEach((file) => {
        formPayload.append('attachments', file);
      });

      const res = await api.post('/issues', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setToast({ type: 'success', message: 'Issue reported successfully!' });
      setTimeout(() => {
        navigate(`/issues/${res.data.issue._id}`);
      }, 1000);
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit issue.',
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Report Campus Problem</h1>
          <p className="text-sm text-slate-500">
            Submit a problem report for facilities, laboratories, electricity, or networking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issue Title *
              </label>
              <input
                type="text"
                required
                minLength={5}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Wi-Fi router keeps resetting during lectures"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority Urgency *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition bg-white"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Building Complex *
                </label>
                <input
                  type="text"
                  required
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="e.g. Science Block B"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Floor
                </label>
                <input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="e.g. 2nd Floor"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Room / Lab #
                </label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="e.g. Room 204"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Description *
              </label>
              <textarea
                required
                rows={4}
                minLength={15}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what went wrong, when you noticed it, and how it impacts student activities..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            {/* Photo Attachment Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Photo Attachments (Optional, max 5 images, up to 5MB each)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-xl hover:border-indigo-400 transition cursor-pointer relative bg-slate-50/50">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                  <div className="text-sm text-slate-600">
                    <span className="font-semibold text-indigo-600 hover:text-indigo-500">
                      Click to upload images
                    </span>{' '}
                    or drag and drop
                  </div>
                  <p className="text-xs text-slate-400">PNG, JPG, WEBP up to 5MB</p>
                </div>
              </div>

              {/* Previews */}
              {previews.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {previews.map((src, index) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm"
                    >
                      <img src={src} alt="Upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 transition shadow-md shadow-indigo-100"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Submitting Report...' : 'Submit Issue Ticket'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Duplicate Issue Prevention Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Similar Open Issues ({duplicates.length})
              </h3>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Before creating a new report, check if someone has already reported the same issue. You can upvote it instead to help prioritize it!
            </p>

            {checkingDuplicates && (
              <p className="text-xs text-indigo-600 font-medium animate-pulse mt-2">
                Checking campus database for similar tickets...
              </p>
            )}

            <div className="mt-4 space-y-3">
              {duplicates.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No similar open issues found. Your report looks unique!
                </div>
              ) : (
                duplicates.map((dup) => (
                  <div
                    key={dup._id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 transition space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-semibold text-slate-500">
                        {dup.ticketNumber}
                      </span>
                      <StatusBadge status={dup.status} size="sm" />
                    </div>

                    <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">
                      {dup.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {dup.building} {dup.room ? `• ${dup.room}` : ''}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleVoteDuplicate(dup._id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                            dup.hasVoted
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'border-slate-200 hover:bg-slate-200/60 text-slate-600'
                          }`}
                        >
                          <ThumbsUp className={`w-3 h-3 ${dup.hasVoted ? 'fill-indigo-600' : ''}`} />
                          {dup.votesCount || 0}
                        </button>

                        <Link
                          to={`/issues/${dup._id}`}
                          target="_blank"
                          className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-0.5"
                          title="Open ticket in new tab"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
