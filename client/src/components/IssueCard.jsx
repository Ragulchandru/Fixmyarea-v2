import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ThumbsUp, 
  MessageSquare, 
  MapPin, 
  Calendar,
  AlertOctagon
} from 'lucide-react';

const IssueCard = ({ issue, onUpvote = null }) => {
  const navigate = useNavigate();
  const { user, t } = useAuth();

  const formattedDate = new Date(issue.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30';
      case 'in_progress':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/30';
      case 'assigned':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/30';
      case 'verified':
        return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30';
      case 'rejected':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/30';
      case 'duplicate':
        return 'bg-slate-500/10 text-slate-500 border border-slate-500/30';
      case 'spam':
        return 'bg-zinc-700/10 text-zinc-500 border border-zinc-500/30';
      default:
        return 'bg-slate-500/10 text-slate-500 border border-slate-500/30';
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white font-bold animate-pulse';
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const hasUpvoted = user && issue.upvotes && issue.upvotes.includes(user.id);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200/50 dark:border-slate-800/50 flex flex-col h-full">
      {/* Image container */}
      <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-950 overflow-hidden group">
        {issue.isEmergency && (
          <span className="absolute top-3 left-3 z-10 bg-red-600 text-white px-2 py-0.5 text-[9px] font-bold tracking-wider rounded uppercase flex items-center space-x-1 animate-pulse shadow-md">
            <AlertOctagon className="h-3 w-3" />
            <span>Emergency</span>
          </span>
        )}
        <span className={`absolute top-3 right-3 z-10 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shadow-sm ${getSeverityStyle(issue.severity)}`}>
          {issue.severity}
        </span>
        {issue.imageUrl ? (
          <img 
            src={issue.imageUrl} 
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-6 text-center">
            <svg className="h-10 w-10 mb-2 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">No photograph attached</span>
          </div>
        )}
      </div>

      {/* Content wrapper */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Tags */}
          <div className="flex items-center space-x-2 mb-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase leading-none ${getStatusStyle(issue.status)}`}>
              {issue.status.replace('_', ' ')}
            </span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full font-medium leading-none capitalize">
              {issue.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-base text-slate-800 dark:text-white line-clamp-1 hover:text-primary dark:hover:text-blue-400 transition-colors cursor-pointer mb-2" onClick={() => navigate(`/issue-detail/${issue._id}`)}>
            {issue.title}
          </h3>

          {/* Location */}
          <div className="flex items-start text-xs text-slate-500 dark:text-slate-400 mb-4 space-x-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500 mt-0.5" />
            <span className="line-clamp-2">
              {issue.panchayatId?.name || 'Local Ward'}, {issue.districtId?.name || 'Tamil Nadu'}
            </span>
          </div>
        </div>

        {/* Footer controls */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center justify-between mt-auto">
          {/* Meta dates */}
          <div className="flex items-center text-[10px] text-slate-400 dark:text-slate-500 space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>

          {/* Stats counters */}
          <div className="flex items-center space-x-3">
            {/* Upvote button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onUpvote) onUpvote(issue._id);
              }}
              className={`flex items-center space-x-1 py-1 px-2 rounded-md text-xs font-semibold transition-all ${
                hasUpvoted 
                  ? 'text-primary bg-primary/10 border border-primary/20 scale-[1.02]' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
              }`}
              title={t('upvote')}
            >
              <ThumbsUp className={`h-3.5 w-3.5 ${hasUpvoted ? 'fill-primary' : ''}`} />
              <span>{issue.upvotes ? issue.upvotes.length : 0}</span>
            </button>

            {/* Comment count indicator */}
            <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-xs py-1 px-1">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{issue.commentCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
