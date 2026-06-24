import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Calendar, MapPin, Eye, ExternalLink, PenTool } from 'lucide-react';

const MyReports = () => {
  const { user, t } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyReports = async () => {
    try {
      const res = await axios.get('/api/issues/my-reports');
      if (res.data.success) {
        setReports(res.data.reports);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30';
      case 'in_progress': return 'bg-amber-500/10 text-amber-500 border border-amber-500/30';
      case 'assigned': return 'bg-blue-500/10 text-blue-500 border border-blue-500/30';
      case 'verified': return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30';
      case 'rejected': return 'bg-rose-500/10 text-rose-500 border border-rose-500/30';
      case 'duplicate': return 'bg-slate-500/10 text-slate-500 border border-slate-500/30';
      default: return 'bg-slate-400/10 text-slate-500 border border-slate-500/30';
    }
  };

  // CSV Exporter for local downloads
  const handleDownloadCSV = () => {
    if (reports.length === 0) return;

    // Headers
    const headers = ['ID', 'Title', 'Category', 'District', 'Panchayat', 'Latitude', 'Longitude', 'Severity', 'Status', 'CreatedAt'];
    
    // Rows
    const rows = reports.map(r => [
      r._id,
      `"${r.title.replace(/"/g, '""')}"`,
      r.category,
      r.districtId?.name || '',
      r.panchayatId?.name || '',
      r.location?.lat || '',
      r.location?.lng || '',
      r.severity,
      r.status,
      new Date(r.createdAt).toISOString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    // Create Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FixMyArea_Report_History_${user.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5 m-0">
            <FileText className="h-6 w-6 text-primary" />
            <span>{t('myReports')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 pl-0.5">Track status of infrastructure complaints submitted by you</p>
        </div>

        {reports.length > 0 && (
          <button
            onClick={handleDownloadCSV}
            className="self-start sm:self-auto bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Download History (CSV)</span>
          </button>
        )}
      </div>

      {/* REPORTS LIST */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-slate-100 dark:bg-slate-900 rounded-2xl h-32 animate-pulse border border-slate-200/20"></div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-12 rounded-3xl text-center text-slate-500 shadow-sm">
          <FileText className="h-12 w-12 text-slate-350 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-850 dark:text-white m-0">No reports found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">You have not submitted any infrastructure alerts yet.</p>
          <button
            onClick={() => navigate('/report')}
            className="mt-5 bg-primary hover:bg-primary/95 text-white font-semibold py-2 px-5 rounded-xl text-xs shadow-md shadow-primary/10 transition-all cursor-pointer"
          >
            Submit first report
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div 
              key={report._id}
              className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-4">
                {/* Thumbnail */}
                <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 shrink-0 border border-slate-100 dark:border-slate-800">
                  {report.imageUrl ? (
                    <img src={report.imageUrl} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                      <FileText className="h-6 w-6 stroke-1" />
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-snug m-0">{report.title}</h4>
                  
                  <div className="flex flex-wrap items-center text-[10px] text-slate-500 dark:text-slate-400 gap-x-3 gap-y-1">
                    <span className="capitalize font-semibold text-slate-650 dark:text-slate-350">{report.category}</span>
                    <div className="flex items-center space-x-1"><MapPin className="h-3 w-3" /><span>{report.panchayatId?.name || 'Local Panchayat'}</span></div>
                    <div className="flex items-center space-x-1"><Calendar className="h-3 w-3" /><span>{new Date(report.createdAt).toLocaleDateString('en-IN')}</span></div>
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-850/80 pt-3 md:pt-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase leading-none ${getStatusStyle(report.status)}`}>
                  {report.status.replace('_', ' ')}
                </span>
                
                <div className="flex items-center space-x-2">
                  {/* Edit button (enabled only if status is submitted or pending) */}
                  {['submitted', 'pending_verification'].includes(report.status) && (
                    <button
                      onClick={() => navigate(`/report` /* Wait, since report page is a wizard, they can submit new or we just let them view */)}
                      className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Pending Report"
                    >
                      <PenTool className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/issue-detail/${report._id}`)}
                    className="bg-slate-50 dark:bg-slate-850 hover:bg-primary hover:text-white dark:hover:bg-primary transition-all text-slate-600 dark:text-slate-300 p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-200/50 dark:border-slate-850 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Track</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default MyReports;
