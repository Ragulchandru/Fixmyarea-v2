import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TNMap from '../components/TNMap';
import { 
  ThumbsUp, 
  Eye, 
  MessageSquare, 
  MapPin, 
  Calendar,
  AlertTriangle,
  User,
  Clock,
  Send,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, t } = useAuth();

  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchIssueDetails = async () => {
    try {
      const config = {};
      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }
      
      const res = await axios.get(`/api/issues/detail/${id}`, config);
      if (res.data.success) {
        setIssue(res.data.issue);
        setComments(res.data.comments);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to load report details. It may be private or deleted.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueDetails();
  }, [id, token]);

  const handleUpvote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.post(`/api/issues/upvote/${issue._id}`);
      if (res.data.success) {
        setIssue({ ...issue, upvotes: res.data.upvotes });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.post(`/api/issues/follow/${issue._id}`);
      if (res.data.success) {
        setIssue({ ...issue, followers: res.data.followers });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;
    setSubmittingComment(true);

    try {
      const res = await axios.post(`/api/issues/comment/${issue._id}`, { content: newComment });
      if (res.data.success) {
        setComments([...comments, res.data.comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="text-sm font-medium">Loading report profile...</p>
      </div>
    );
  }

  if (errorMsg || !issue) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="text-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded-full inline-block mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Access Restricted</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{errorMsg}</p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-6 bg-primary text-white font-semibold py-2 px-5 rounded-xl text-sm transition-colors cursor-pointer"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return '#22c55e';
      case 'in_progress': return '#f59e0b';
      case 'assigned': return '#2563eb';
      case 'verified': return '#6366f1';
      default: return '#ef4444';
    }
  };

  const hasUpvoted = user && issue.upvotes && issue.upvotes.includes(user.id);
  const hasFollowed = user && issue.followers && issue.followers.includes(user.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 animate-fade-in">
      
      {/* LEFT 2 COLUMNS: PHOTOS, DETAILS, TIMELINE */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Photo Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
          {issue.imageUrl ? (
            <img src={issue.imageUrl} className="w-full max-h-[420px] object-cover" alt={issue.title} />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-950 p-6">
              <svg className="h-16 w-16 mb-2 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">No photo available</span>
            </div>
          )}

          {/* Details header */}
          <div className="p-6 md:p-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase text-white shadow-sm" style={{ backgroundColor: getStatusColor(issue.status) }}>
                {issue.status.replace('_', ' ')}
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-0.5 rounded-full text-xs font-medium capitalize">
                {issue.category}
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-0.5 rounded-full text-xs font-semibold uppercase">
                {issue.severity} priority
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight m-0">
              {issue.title}
            </h2>

            <div className="flex flex-wrap items-center text-xs text-slate-500 dark:text-slate-400 gap-y-2 gap-x-4 pt-1 border-b border-slate-100 dark:border-slate-850/80 pb-4">
              <div className="flex items-center space-x-1">
                <User className="h-3.5 w-3.5" />
                <span>
                  {issue.isAnonymous ? t('anonymous') : (issue.userId ? issue.userId.name : t('anonymous'))}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(issue.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line pt-2">
              {issue.description}
            </div>

            {/* UPVOTE & FOLLOW ACTIONS */}
            <div className="flex items-center space-x-3 pt-4 border-t border-slate-100 dark:border-slate-850/80">
              <button
                onClick={handleUpvote}
                className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold transition-all border ${
                  hasUpvoted 
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[1.02]' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-950 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-850 dark:text-slate-400'
                }`}
              >
                <ThumbsUp className={`h-4 w-4 ${hasUpvoted ? 'fill-white' : ''}`} />
                <span>{hasUpvoted ? 'Upvoted' : 'Upvote Report'} ({issue.upvotes?.length || 0})</span>
              </button>

              <button
                onClick={handleFollow}
                className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold transition-all border ${
                  hasFollowed 
                    ? 'bg-indigo-600 text-white border-indigo-650 shadow-md shadow-indigo-650/20 scale-[1.02]' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-950 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-850 dark:text-slate-400'
                }`}
              >
                <Eye className="h-4 w-4" />
                <span>{hasFollowed ? 'Following Updates' : 'Follow Updates'} ({issue.followers?.length || 0})</span>
              </button>
            </div>
          </div>
        </div>

        {/* PROGRESS HISTORY TIMELINE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-850 dark:text-white tracking-tight m-0">Resolution Activity Timeline</h3>

          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-8 py-2">
            
            {/* Base submission point */}
            <div className="relative">
              <div className="absolute h-4 w-4 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 -left-[31px] top-1"></div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  {new Date(issue.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}, {new Date(issue.createdAt).toLocaleDateString('en-IN')}
                </span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-1 m-0">Report Submitted</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Logged successfully in the system. Status set to submitted.</p>
              </div>
            </div>

            {/* Map updates */}
            {issue.progressNotes && issue.progressNotes.map((note, index) => (
              <div key={note._id || index} className="relative">
                <div className="absolute h-4 w-4 bg-primary rounded-full border-4 border-white dark:border-slate-900 -left-[31px] top-1" style={{ backgroundColor: getStatusColor(note.status) }}></div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {new Date(note.updatedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}, {new Date(note.updatedAt).toLocaleDateString('en-IN')}
                  </span>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-1 m-0 capitalize">
                    {note.status.replace('_', ' ')}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                    "{note.note}"
                  </p>
                  {note.photoUrl && (
                    <div className="mt-3 max-w-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                      <img src={note.photoUrl} className="w-full max-h-40 object-cover" alt="Progress upload" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Current pending status if empty */}
            {issue.status === 'submitted' && (
              <div className="relative">
                <div className="absolute h-4 w-4 bg-red-500 rounded-full border-4 border-white dark:border-slate-900 -left-[31px] top-1 animate-ping"></div>
                <div className="absolute h-4 w-4 bg-red-500 rounded-full border-4 border-white dark:border-slate-900 -left-[31px] top-1"></div>
                <div>
                  <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 m-0">Pending Administrator Verification</h4>
                  <p className="text-xs text-slate-400 mt-1">Authorized personnel are validating details. Public display pending.</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT 1 COLUMN: MAP & DISCUSSION BOARD */}
      <div className="space-y-6">
        
        {/* MAP CONTAINER CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider pl-1 m-0">GPS Location Coordinates</h3>
          <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <TNMap 
              interactive={false} 
              issues={[issue]} 
              initialLocation={{ lat: issue.location.lat, lng: issue.location.lng }}
              zoom={14}
              height="200px"
            />
          </div>
          <div className="text-[11px] text-slate-500 leading-normal pl-1">
            <div className="font-semibold text-slate-850 dark:text-white flex items-center space-x-1.5 mb-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="line-clamp-2">{issue.location.address || 'Address not registered'}</span>
            </div>
            <div>Constituency: <span className="font-semibold text-slate-700 dark:text-slate-350">{issue.constituencyId?.name}</span></div>
            <div>Ward / Village: <span className="font-semibold text-slate-700 dark:text-slate-350">{issue.wardId?.name}</span></div>
          </div>
        </div>

        {/* EMPLOYEE ASSIGNED CARD */}
        {issue.assignedEmployeeId && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-3xl shadow-sm flex items-center space-x-3.5">
            <div className="bg-blue-100 dark:bg-blue-950/30 p-2.5 rounded-2xl text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Assigned Official</div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white m-0 mt-0.5">{issue.assignedEmployeeId.name}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Municipal Resolution Officer</p>
            </div>
          </div>
        )}

        {/* COMMENTS / DISCUSSION BOARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm flex flex-col justify-between h-[450px]">
          <div>
            <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 dark:border-slate-850 pb-3 mt-0 m-0">
              <MessageSquare className="h-4.5 w-4.5 text-slate-400" />
              <span>Discussion Board ({comments.length})</span>
            </h3>

            {/* Comment list container */}
            <div className="overflow-y-auto max-h-[300px] space-y-3.5 pr-1.5 pt-4">
              {comments.length === 0 ? (
                <div className="text-center text-slate-400 py-12 text-xs">
                  No community comments posted yet.
                </div>
              ) : (
                comments.map((comm) => (
                  <div key={comm._id} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-1">
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{comm.userId?.name}</span>
                      <span>{new Date(comm.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 m-0 leading-normal">{comm.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comment submission form */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-850/80">
            {user ? (
              <form onSubmit={handleCommentSubmit} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Post a query/support note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="bg-primary hover:bg-primary/95 text-white p-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <div className="text-center py-2 text-[10px] text-slate-500">
                Please{' '}
                <button onClick={() => navigate('/login')} className="text-primary font-bold hover:underline">
                  Log In
                </button>{' '}
                to leave a comment.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default IssueDetails;
