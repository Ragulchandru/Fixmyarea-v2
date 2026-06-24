import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  UserX, 
  UserCheck, 
  MapPin, 
  Clock, 
  Layers, 
  Settings, 
  Users, 
  Trash2,
  GitMerge,
  Send,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // State variables for resources
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [panchayats, setPanchayats] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  // Forms State
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '', districts: [], panchayats: [] });
  const [newDistrict, setNewDistrict] = useState({ name: '', code: '' });
  const [newConstituency, setNewConstituency] = useState({ name: '', districtId: '' });
  const [newPanchayat, setNewPanchayat] = useState({ name: '', unionName: '', districtId: '' });
  const [newWard, setNewWard] = useState({ name: '', panchayatId: '' });

  // Interactive controls
  const [assignTargetReport, setAssignTargetReport] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [mergeTargetPrimary, setMergeTargetPrimary] = useState('');
  const [mergeDuplicatesList, setMergeDuplicatesList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Load Admin Data
  const loadAdminData = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // Fetch analytics stats
      const statsRes = await axios.get('/api/admin/analytics');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      // Fetch all reports
      const reportsRes = await axios.get('/api/admin/reports');
      if (reportsRes.data.success) {
        setReports(reportsRes.data.reports);
      }

      // Fetch users
      const usersRes = await axios.get('/api/admin/users');
      if (usersRes.data.success) {
        setUsers(usersRes.data.users);
        setEmployees(usersRes.data.users.filter(u => u.role === 'employee'));
      }

      // Fetch districts for geography dropdowns
      const distsRes = await axios.get('/api/geography/districts');
      if (distsRes.data.success) {
        setDistricts(distsRes.data.districts);
      }

      // Fetch audit logs
      const logsRes = await axios.get('/api/admin/audit-logs');
      if (logsRes.data.success) {
        setAuditLogs(logsRes.data.logs);
      }

      // Fetch settings
      const settingsRes = await axios.get('/api/admin/settings');
      if (settingsRes.data.success && settingsRes.data.settings) {
        setMaintenanceMode(settingsRes.data.settings.maintenanceMode);
        setMaintenanceMessage(settingsRes.data.settings.maintenanceMessage);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to load portal configuration databases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  // Toast message timeout
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Report status commands
  const handleVerifyReport = async (id) => {
    setActionLoading(true);
    try {
      const res = await axios.put(`/api/admin/reports/${id}/verify`);
      if (res.data.success) {
        setSuccessMsg('Report verified and published successfully!');
        loadAdminData();
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReport = async () => {
    if (!rejectTargetId) return;
    setActionLoading(true);
    try {
      const res = await axios.put(`/api/admin/reports/${rejectTargetId}/reject`, { reason: rejectReason });
      if (res.data.success) {
        setSuccessMsg('Report rejected.');
        setRejectTargetId(null);
        setRejectReason('');
        loadAdminData();
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignEmployee = async () => {
    if (!assignTargetReport || !selectedEmployeeId) return;
    setActionLoading(true);
    try {
      const res = await axios.put(`/api/admin/reports/${assignTargetReport}/assign`, { employeeId: selectedEmployeeId });
      if (res.data.success) {
        setSuccessMsg('Resolution officer assigned successfully!');
        setAssignTargetReport(null);
        setSelectedEmployeeId('');
        loadAdminData();
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Assignment failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this report? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      const res = await axios.delete(`/api/admin/reports/${id}`);
      if (res.data.success) {
        setSuccessMsg('Report deleted from database.');
        loadAdminData();
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Deletion failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMergeDuplicates = async () => {
    if (!mergeTargetPrimary || mergeDuplicatesList.length === 0) {
      setErrorMsg('Select primary and duplicate report files.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await axios.post('/api/admin/reports/merge', {
        primaryIssueId: mergeTargetPrimary,
        duplicateIssueIds: mergeDuplicatesList
      });
      if (res.data.success) {
        setSuccessMsg('Reports merged successfully!');
        setMergeTargetPrimary('');
        setMergeDuplicatesList([]);
        loadAdminData();
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Merge failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // User management commands
  const handleUserStatus = async (id, status) => {
    setActionLoading(true);
    try {
      const res = await axios.put(`/api/admin/users/${id}/status`, { status });
      if (res.data.success) {
        setSuccessMsg(`User status updated to ${status}.`);
        loadAdminData();
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Failed to update user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserPasswordReset = async (id) => {
    if (!window.confirm('Reset this user password to the default "Reset@123"?')) return;
    setActionLoading(true);
    try {
      const res = await axios.put(`/api/admin/users/${id}/reset`);
      if (res.data.success) {
        setSuccessMsg('Password reset successfully to default "Reset@123".');
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Password reset failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Seeding forms
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await axios.post('/api/admin/employees', newEmployee);
      if (res.data.success) {
        setSuccessMsg('Employee account created successfully!');
        setNewEmployee({ name: '', email: '', password: '', districts: [], panchayats: [] });
        loadAdminData();
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Failed to create employee.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateDistrict = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await axios.post('/api/admin/geography/district', newDistrict);
      if (res.data.success) {
        setSuccessMsg(`Added district: ${newDistrict.name}`);
        setNewDistrict({ name: '', code: '' });
        loadAdminData();
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Failed to add district.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateConstituency = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await axios.post('/api/admin/geography/constituency', newConstituency);
      if (res.data.success) {
        setSuccessMsg(`Added constituency: ${newConstituency.name}`);
        setNewConstituency({ name: '', districtId: '' });
        loadAdminData();
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Failed to add constituency.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePanchayat = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await axios.post('/api/admin/geography/panchayat', newPanchayat);
      if (res.data.success) {
        setSuccessMsg(`Added Panchayat: ${newPanchayat.name}`);
        setNewPanchayat({ name: '', unionName: '', districtId: '' });
        loadAdminData();
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Failed to add Panchayat.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateWard = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await axios.post('/api/admin/geography/ward', newWard);
      if (res.data.success) {
        setSuccessMsg(`Added Ward: ${newWard.name}`);
        setNewWard({ name: '', panchayatId: '' });
        loadAdminData();
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Failed to add Ward.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Settings Mode
  const handleToggleMaintenance = async () => {
    setActionLoading(true);
    try {
      const res = await axios.put('/api/admin/settings/maintenance', {
        maintenanceMode: !maintenanceMode,
        maintenanceMessage
      });
      if (res.data.success) {
        setMaintenanceMode(res.data.settings.maintenanceMode);
        setSuccessMsg(`Maintenance Mode is now ${res.data.settings.maintenanceMode ? 'ACTIVE' : 'INACTIVE'}`);
      }
    } catch (e) {
      setErrorMsg('Failed to update maintenance settings.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="text-sm font-medium">Authorizing Admin Console...</p>
      </div>
    );
  }

  const pendingVerificationList = reports.filter(r => r.status === 'submitted');
  const activeReportsList = reports.filter(r => ['verified', 'assigned', 'in_progress'].includes(r.status));

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      
      {/* Toast Alert box */}
      {(successMsg || errorMsg) && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5 m-0">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            <span>State Administrator Console</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 pl-0.5">Control center for report moderation, users database, and geographical hierarchies</p>
        </div>
        <button 
          onClick={loadAdminData}
          disabled={actionLoading}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 transition-colors border border-slate-200/50 dark:border-slate-800"
          title="Refresh panel data"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* TABS NAV */}
      <div className="flex overflow-x-auto bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-x-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: Clock },
          { id: 'verification', label: `Moderation (${pendingVerificationList.length})`, icon: CheckCircle },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'employees', label: 'Employees', icon: Users },
          { id: 'geography', label: 'Locations', icon: MapPin },
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'audit', label: 'Audit Logs', icon: Layers }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-2 cursor-pointer ${
                active 
                  ? 'bg-primary text-white shadow-md shadow-primary/10' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-250'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* -------------------- TAB 1: OVERVIEW -------------------- */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Counters Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.totalReports}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Submitted Reports</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm">
              <div className="text-2xl font-extrabold text-red-500">{stats.pendingVerification}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Pending Verification</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm">
              <div className="text-2xl font-extrabold text-emerald-500">{stats.resolvedReports}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Resolved Reports</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm">
              <div className="text-2xl font-extrabold text-primary dark:text-blue-400">{stats.resolutionRate}%</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Resolution Rate</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* District distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider pl-1 m-0">District Wise Distribution</h3>
              <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                {stats.districtBreakdown.length === 0 ? (
                  <div className="text-slate-400 text-xs text-center py-12">No reports recorded in districts.</div>
                ) : (
                  stats.districtBreakdown.map((dist, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-850 pb-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{dist.name}</span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 dark:text-slate-400">{dist.count} reports</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Category distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider pl-1 m-0">Category Breakdown</h3>
              <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                {stats.categoryBreakdown.length === 0 ? (
                  <div className="text-slate-400 text-xs text-center py-12">No reports categorized.</div>
                ) : (
                  stats.categoryBreakdown.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-850 pb-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-350 capitalize">{cat.name}</span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 dark:text-slate-400">{cat.count} reports</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Employee Performance Leaderboard */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm space-y-4 lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider pl-1 m-0">Municipal Operator Performance Leaderboard</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5">Name</th>
                      <th className="py-2.5">Assigned Cases</th>
                      <th className="py-2.5">Resolved Cases</th>
                      <th className="py-2.5">Resolution Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850/80">
                    {stats.employeePerformance.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-slate-450 italic">No operators provisioned yet.</td>
                      </tr>
                    ) : (
                      stats.employeePerformance.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/20">
                          <td className="py-3 font-semibold text-slate-750 dark:text-slate-250">{emp.name}</td>
                          <td className="py-3">{emp.assigned}</td>
                          <td className="py-3 text-emerald-500 font-semibold">{emp.resolved}</td>
                          <td className="py-3 font-bold text-slate-900 dark:text-white">{emp.performanceScore}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 2: VERIFICATION (MODERATION) -------------------- */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider pl-1 m-0">Submitted Reports Verification Queue ({pendingVerificationList.length})</h3>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {pendingVerificationList.length === 0 ? (
                <div className="text-center py-12 text-slate-450 italic text-xs">
                  Moderation queue is clean. No reports pending verification.
                </div>
              ) : (
                pendingVerificationList.map((report) => (
                  <div key={report._id} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col md:flex-row items-start justify-between gap-4 text-xs">
                    <div className="flex items-start space-x-3.5">
                      {/* Photo Thumbnail */}
                      <div className="h-16 w-16 bg-slate-200 dark:bg-slate-900 rounded-xl overflow-hidden shrink-0">
                        {report.imageUrl && <img src={report.imageUrl} className="h-full w-full object-cover" alt="" />}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 dark:text-white m-0 text-sm leading-snug">{report.title}</h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                          <span className="font-semibold capitalize text-slate-650">{report.category}</span>
                          <span>District: {report.districtId?.name}</span>
                          <span>Constituency: {report.constituencyId?.name}</span>
                          <span>Ward: {report.wardId?.name}</span>
                          <span className="font-semibold text-red-500">{report.severity.toUpperCase()} Priority</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-450 mt-1 max-w-lg truncate leading-normal italic">
                          "{report.description}"
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-end md:self-auto pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleVerifyReport(report._id)}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-3 rounded-lg text-[10px] cursor-pointer flex items-center space-x-1"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Verify & Publish</span>
                      </button>

                      <button
                        onClick={() => { setRejectTargetId(report._id); setRejectReason(''); }}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-1.5 px-3 rounded-lg text-[10px] cursor-pointer flex items-center space-x-1"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => { setAssignTargetReport(report._id); setSelectedEmployeeId(''); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 rounded-lg text-[10px] cursor-pointer flex items-center space-x-1"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Assign Operator</span>
                      </button>

                      <button
                        onClick={() => handleDeleteReport(report._id)}
                        disabled={actionLoading}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg cursor-pointer"
                        title="Hard Delete Report"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick interactive reject drawer popup */}
          {rejectTargetId && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-3xl shadow-lg max-w-md mx-auto space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white m-0">Reject Submission</h3>
              <textarea
                placeholder="Enter rejection reason to notify citizen..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl py-2 px-3 text-xs"
                rows={3}
              />
              <div className="flex justify-end space-x-2 text-xs">
                <button onClick={() => setRejectTargetId(null)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
                <button onClick={handleRejectReport} className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg">Confirm Reject</button>
              </div>
            </div>
          )}

          {/* Quick interactive assign employee popup */}
          {assignTargetReport && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-3xl shadow-lg max-w-md mx-auto space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white m-0">Assign Resolution Operator</h3>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl py-2 px-3 text-xs"
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
                ))}
              </select>
              <div className="flex justify-end space-x-2 text-xs">
                <button onClick={() => setAssignTargetReport(null)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
                <button onClick={handleAssignEmployee} className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg">Confirm Assign</button>
              </div>
            </div>
          )}

          {/* MERGE DUPLICATES SUB-PANEL */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider pl-1 m-0 flex items-center space-x-2">
              <GitMerge className="h-4.5 w-4.5 text-slate-400" />
              <span>Merge Duplicate Submissions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 pl-1">Primary Verified Report</label>
                <select
                  value={mergeTargetPrimary}
                  onChange={(e) => setMergeTargetPrimary(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl py-2 px-3 text-xs"
                >
                  <option value="">Select Primary verified report</option>
                  {reports.filter(r => ['verified', 'assigned', 'in_progress'].includes(r.status)).map(r => (
                    <option key={r._id} value={r._id}>{r.title} ({r._id.substring(18)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 pl-1">Duplicate Report (Mark as dup of primary)</label>
                <select
                  value={mergeDuplicatesList[0] || ''}
                  onChange={(e) => setMergeDuplicatesList(e.target.value ? [e.target.value] : [])}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl py-2 px-3 text-xs"
                >
                  <option value="">Select duplicate report</option>
                  {reports.filter(r => r._id !== mergeTargetPrimary).map(r => (
                    <option key={r._id} value={r._id}>{r.title} ({r._id.substring(18)})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleMergeDuplicates}
                disabled={actionLoading || !mergeTargetPrimary || mergeDuplicatesList.length === 0}
                className="bg-primary hover:bg-primary/95 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <GitMerge className="h-3.5 w-3.5" />
                <span>Merge Reports</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 3: USER MANAGEMENT -------------------- */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider pl-1 m-0">Citizen Directory Control</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Reputation</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/80">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-850/20">
                    <td className="py-3 font-semibold text-slate-750 dark:text-slate-250">{u.name}</td>
                    <td className="py-3">{u.email}</td>
                    <td className="py-3 font-semibold uppercase text-[10px] text-slate-500">{u.role}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 font-bold">{u.reputation}</td>
                    <td className="py-3 text-right">
                      {u.role !== 'admin' && (
                        <div className="flex items-center justify-end space-x-1.5">
                          {u.status === 'active' ? (
                            <button
                              onClick={() => handleUserStatus(u._id, 'suspended')}
                              className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-semibold py-1 px-2 rounded cursor-pointer"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserStatus(u._id, 'active')}
                              className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1 px-2 rounded cursor-pointer"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleUserPasswordReset(u._id)}
                            className="text-[10px] bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 py-1 px-2 rounded font-semibold border border-slate-200/50 dark:border-slate-850 cursor-pointer"
                          >
                            Reset Pwd
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- TAB 4: EMPLOYEE PROVISIONING -------------------- */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create employee form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider pl-1 m-0">Provision Operator Account</h3>
            
            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Employee Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Officer name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Official Email ID</label>
                <input
                  type="email"
                  required
                  placeholder="email@fixmyarea.tn.gov.in"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="Temp pwd (min 6 chars)"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Allocate District</label>
                <select
                  multiple
                  value={newEmployee.districts}
                  onChange={(e) => {
                    const vals = Array.from(e.target.selectedOptions, option => option.value);
                    setNewEmployee({ ...newEmployee, districts: vals });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs h-24"
                >
                  {districts.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
                <span className="text-[9px] text-slate-400 pl-1">Hold Ctrl to select multiple districts</span>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-primary/10 cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Create Operator Account</span>
              </button>
            </form>
          </div>

          {/* Active employees list */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider pl-1 m-0">Provisioned Municipal Operators</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Allotted districts</th>
                    <th className="py-2.5 text-right">Account Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850/80">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400 italic">No operators provisioned.</td>
                    </tr>
                  ) : (
                    employees.map(emp => (
                      <tr key={emp._id} className="hover:bg-slate-50 dark:hover:bg-slate-850/20">
                        <td className="py-3 font-semibold text-slate-750 dark:text-slate-250">{emp.name}</td>
                        <td className="py-3">{emp.email}</td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {emp.assignedLocations?.districts?.map(dId => {
                              const dName = districts.find(d => d._id === dId)?.name || 'District';
                              return <span key={dId} className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 px-1.5 py-0.5 rounded text-[9px] font-medium">{dName}</span>;
                            })}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleUserStatus(emp._id, emp.status === 'active' ? 'suspended' : 'active')}
                            className={`text-[9px] font-bold uppercase rounded px-2 py-1 cursor-pointer ${
                              emp.status === 'active' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20'
                            }`}
                          >
                            {emp.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 5: GEOGRAPHICAL REGISTRY -------------------- */}
      {activeTab === 'geography' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Add District */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-white m-0 text-sm">1. Register District</h4>
            <form onSubmit={handleCreateDistrict} className="space-y-3.5 text-xs">
              <input
                type="text"
                required
                placeholder="District Name (e.g. Salem)"
                value={newDistrict.name}
                onChange={(e) => setNewDistrict({ ...newDistrict, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              />
              <input
                type="text"
                required
                placeholder="Code (e.g. SLM)"
                value={newDistrict.code}
                onChange={(e) => setNewDistrict({ ...newDistrict, code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              />
              <button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-2 px-3 rounded-xl text-xs cursor-pointer">
                Add District
              </button>
            </form>
          </div>

          {/* Add Constituency */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-white m-0 text-sm">2. Register Constituency</h4>
            <form onSubmit={handleCreateConstituency} className="space-y-3.5 text-xs">
              <select
                required
                value={newConstituency.districtId}
                onChange={(e) => setNewConstituency({ ...newConstituency, districtId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              >
                <option value="">Select District</option>
                {districts.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Constituency Name"
                value={newConstituency.name}
                onChange={(e) => setNewConstituency({ ...newConstituency, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              />
              <button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-2 px-3 rounded-xl text-xs cursor-pointer">
                Add Constituency
              </button>
            </form>
          </div>

          {/* Add Panchayat */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-white m-0 text-sm">3. Register Panchayat</h4>
            <form onSubmit={handleCreatePanchayat} className="space-y-3.5 text-xs">
              <select
                required
                value={newPanchayat.districtId}
                onChange={(e) => {
                  setNewPanchayat({ ...newPanchayat, districtId: e.target.value });
                  // Preload panchayats list to pick parent later if needed
                  axios.get(`/api/geography/panchayats/${e.target.value}`).then(res => {
                    if (res.data.success) setPanchayats(res.data.panchayats);
                  });
                }}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              >
                <option value="">Select District</option>
                {districts.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Panchayat Name (e.g. Chennimalai)"
                value={newPanchayat.name}
                onChange={(e) => setNewPanchayat({ ...newPanchayat, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              />
              <input
                type="text"
                required
                placeholder="Union Name (e.g. Chennimalai Union)"
                value={newPanchayat.unionName}
                onChange={(e) => setNewPanchayat({ ...newPanchayat, unionName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              />
              <button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-2 px-3 rounded-xl text-xs cursor-pointer">
                Add Panchayat
              </button>
            </form>
          </div>

          {/* Add Ward */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-white m-0 text-sm">4. Register Ward</h4>
            <form onSubmit={handleCreateWard} className="space-y-3.5 text-xs">
              <select
                required
                onChange={(e) => {
                  // Fetch panchayats based on district first
                  axios.get(`/api/geography/panchayats/${e.target.value}`).then(res => {
                    if (res.data.success) setPanchayats(res.data.panchayats);
                  });
                }}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              >
                <option value="">First Select District</option>
                {districts.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
              
              <select
                required
                value={newWard.panchayatId}
                disabled={panchayats.length === 0}
                onChange={(e) => setNewWard({ ...newWard, panchayatId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs disabled:opacity-50"
              >
                <option value="">Select Panchayat Union</option>
                {panchayats.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              
              <input
                type="text"
                required
                placeholder="Ward number/Village name"
                value={newWard.name}
                onChange={(e) => setNewWard({ ...newWard, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              />
              
              <button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-2 px-3 rounded-xl text-xs cursor-pointer">
                Add Ward
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- TAB 6: SETTINGS & MAINTENANCE -------------------- */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 md:p-8 rounded-3xl shadow-sm space-y-6 max-w-2xl mx-auto">
          <h3 className="text-base font-bold text-slate-850 dark:text-white tracking-tight flex items-center space-x-2 m-0">
            <Settings className="h-5 w-5 text-primary" />
            <span>Portal Settings Configuration</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
              <div>
                <div className="font-semibold text-slate-800 dark:text-white text-sm">System Maintenance Mode</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-normal">
                  Activating maintenance blocks Citizen/Employee sessions, displaying a warning splash page. Admins can bypass this block.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={handleToggleMaintenance}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-850 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-650 peer-checked:bg-primary"></div>
              </label>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Maintenance Splash Message</label>
              <textarea
                placeholder="Alert text displayed on the splash screen..."
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl py-2 px-3 text-xs"
                rows={3}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleToggleMaintenance}
                className="bg-primary hover:bg-primary/95 text-white font-semibold py-2 px-5 rounded-xl text-xs cursor-pointer shadow-md shadow-primary/10"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 7: AUDIT LOGS -------------------- */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider pl-1 m-0 flex items-center space-x-2">
            <Layers className="h-4.5 w-4.5 text-slate-400" />
            <span>Portal Administrative Audit Log Registry ({auditLogs.length})</span>
          </h3>

          <div className="overflow-y-auto max-h-[400px] space-y-3 pr-1.5 text-xs">
            {auditLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic">No administrative actions logged.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log._id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-450 dark:text-slate-500 font-mono font-semibold">
                    <span>Admin: {log.adminId?.name || 'Super Admin'} ({log.adminId?.email || 'System'})</span>
                    <span>{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white m-0 text-sm">{log.action}</h4>
                  <p className="text-slate-650 dark:text-slate-400 m-0 mt-1 leading-normal">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
