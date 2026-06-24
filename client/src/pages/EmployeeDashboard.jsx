import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Clock, CheckCircle, AlertTriangle, PenTool, Eye, X, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const { t } = useAuth();
  const navigate = useNavigate();
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status modification form state
  const [activeIssueId, setActiveIssueId] = useState(null);
  const [status, setStatus] = useState('in_progress');
  const [note, setNote] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAssignedIssues = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/employee/assigned');
      if (res.data.success) {
        setAssignedIssues(res.data.issues);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to fetch assigned complaints database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedIssues();
  }, []);

  // Alert message automatic hide
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!activeIssueId || !note.trim()) {
      setErrorMsg('Please enter a progress note.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('status', status);
      formData.append('note', note);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      const res = await axios.put(`/api/employee/issue/${activeIssueId}`, formData, config);
      if (res.data.success) {
        setSuccessMsg('Status updated successfully!');
        // Reset states
        setActiveIssueId(null);
        setNote('');
        setImageFile(null);
        setImagePreview('');
        fetchAssignedIssues();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30';
      case 'in_progress': return 'bg-amber-500/10 text-amber-500 border border-amber-500/30';
      case 'assigned': return 'bg-blue-500/10 text-blue-500 border border-blue-500/30';
      default: return 'bg-slate-400/10 text-slate-500 border border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      
      {/* Toast Alert Box */}
      {(successMsg || errorMsg) && (
        <div className="fixed top-6 right-6 z-50">
          {successMsg && (
            <div className="bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-sm font-semibold border border-emerald-600/30">
              <CheckCircle className="h-5 w-5" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="bg-red-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-sm font-semibold border border-red-650/30">
              <AlertTriangle className="h-5 w-5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* HEADER SECTION */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5 m-0">
          <Briefcase className="h-6 w-6 text-primary" />
          <span>Resolution Officer Panel</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1 pl-0.5">Municipal workflow interface for field operators to track and update assigned repair files</p>
      </div>

      {/* ASSIGNED ISSUES BOARD */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(n => (
            <div key={n} className="bg-slate-100 dark:bg-slate-900 rounded-2xl h-36 animate-pulse border border-slate-200/20"></div>
          ))}
        </div>
      ) : assignedIssues.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-12 rounded-3xl text-center text-slate-500 shadow-sm">
          <Briefcase className="h-12 w-12 text-slate-350 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-850 dark:text-white m-0">No assigned tasks</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">There are currently no active infrastructure resolution tasks assigned to your name.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignedIssues.map((issue) => (
            <div 
              key={issue._id}
              className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              {/* Photo top */}
              <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                {issue.imageUrl ? (
                  <img src={issue.imageUrl} className="h-full w-full object-cover" alt="" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-450 dark:text-slate-650">No photograph attached</div>
                )}
                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  issue.severity === 'critical' ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-500 text-white'
                }`}>
                  {issue.severity}
                </span>
              </div>

              {/* Body details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase leading-none ${getStatusColor(issue.status)}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-450 px-2 py-0.5 rounded-full font-medium leading-none capitalize">
                      {issue.category}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white line-clamp-1 leading-snug m-0">{issue.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450 line-clamp-2 leading-relaxed m-0 italic">"{issue.description}"</p>
                  
                  <div className="text-[10px] text-slate-450 pt-1 font-mono">
                    <div>Panchayat: {issue.panchayatId?.name}</div>
                    <div>Ward: {issue.wardId?.name}</div>
                    <div>Address: {issue.location?.address}</div>
                  </div>
                </div>

                {/* Operations footer */}
                <div className="border-t border-slate-100 dark:border-slate-850/80 pt-4 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/issue-detail/${issue._id}`)}
                    className="text-xs text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Eye className="h-4 w-4 text-slate-400" />
                    <span>View details</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveIssueId(issue._id);
                      setStatus(issue.status === 'assigned' ? 'in_progress' : issue.status);
                      setNote('');
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    disabled={issue.status === 'resolved'}
                    className="bg-primary hover:bg-primary/95 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    <span>Update Status</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* POPUP UPDATE FORM MODAL */}
      {activeIssueId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActiveIssueId(null)}>
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveIssueId(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-855 dark:text-white m-0">Update Resolution Status</h3>
              <p className="text-xs text-slate-400 mt-1">Provide field progress notes and upload completion photographs</p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              
              {/* Status Select */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 pl-1">Target Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
                >
                  <option value="in_progress">In Progress (Work started)</option>
                  <option value="resolved">Resolved (Work completed)</option>
                </select>
              </div>

              {/* Progress note */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 pl-1">Progress Remarks</label>
                <textarea
                  required
                  placeholder="Describe field activities or resolution remarks..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
                  rows={3}
                />
              </div>

              {/* Progress upload photo */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1.5 pl-1">Attach Field Photo (Optional)</label>
                {imagePreview ? (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group shadow-md">
                    <img src={imagePreview} className="w-full h-full object-cover" alt="" />
                    <button 
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(''); }}
                      className="absolute top-2.5 right-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer p-4 bg-slate-50 dark:bg-slate-950 select-none">
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span className="font-semibold text-[11px] text-slate-700 dark:text-slate-350 mt-1">Upload progress photo</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* Controls */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-primary/10 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Confirm Status Change</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeDashboard;
