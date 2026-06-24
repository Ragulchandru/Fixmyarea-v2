import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TNMap from '../components/TNMap';
import IssueCard from '../components/IssueCard';
import { 
  PlusCircle, 
  Map, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  ArrowRight
} from 'lucide-react';

const Home = () => {
  const { t, lang } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, resolved: 0, active: 0, districts: 0 });
  const [recentIssues, setRecentIssues] = useState([]);
  const [allVerifiedIssues, setAllVerifiedIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // 1. Fetch statistics
        const statsRes = await axios.get('/api/issues/stats');
        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }

        // 2. Fetch all verified issues for map and recent cards
        const issuesRes = await axios.get('/api/issues/verified');
        if (issuesRes.data.success) {
          setAllVerifiedIssues(issuesRes.data.issues);
          // Get top 3 latest
          setRecentIssues(issuesRes.data.issues.slice(0, 3));
        }
      } catch (e) {
        console.error('Failed to fetch home page data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const handleUpvote = async (issueId) => {
    try {
      const res = await axios.post(`/api/issues/upvote/${issueId}`);
      if (res.data.success) {
        // Update local state
        const updateList = (list) => list.map(issue => 
          issue._id === issueId ? { ...issue, upvotes: res.data.upvotes } : issue
        );
        setAllVerifiedIssues(updateList(allVerifiedIssues));
        setRecentIssues(updateList(recentIssues));
      }
    } catch (e) {
      if (e.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* 1. HERO SECTION */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-800 dark:from-slate-900 dark:to-slate-800 text-white p-8 md:p-12 shadow-lg shadow-primary/10">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative max-w-2xl space-y-6">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 dark:bg-slate-850 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span>State Infrastructure Monitoring</span>
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight m-0 text-white">
            {t('welcome')}
          </h2>
          <p className="text-sm md:text-base text-slate-100/90 leading-relaxed font-normal">
            {t('heroText')}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
            <button
              onClick={() => navigate('/report')}
              className="bg-white text-primary dark:bg-primary dark:text-white hover:bg-slate-50 dark:hover:bg-primary/95 font-semibold py-3 px-6 rounded-2xl text-sm transition-all flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>{t('quickReport')}</span>
            </button>
            <button
              onClick={() => navigate('/map-view')}
              className="bg-transparent hover:bg-white/10 text-white border border-white/30 font-semibold py-3 px-6 rounded-2xl text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Map className="h-4.5 w-4.5" />
              <span>{t('exploreMap')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center space-x-2 m-0">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>{t('statistics')}</span>
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total reports */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('totalReports')}</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">{stats.total}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">All submitted alerts</span>
          </div>

          {/* Card 2: Resolved */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('resolvedIssues')}</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <span className="text-3xl font-extrabold text-emerald-500 leading-none">{stats.resolved}</span>
            </div>
            <span className="text-[10px] text-emerald-500 font-medium mt-2 flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Completed actions</span>
            </span>
          </div>

          {/* Card 3: Active */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('activeIssues')}</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <span className="text-3xl font-extrabold text-primary dark:text-blue-400 leading-none">{stats.active}</span>
            </div>
            <span className="text-[10px] text-amber-500 font-medium mt-2 flex items-center space-x-1">
              <AlertCircle className="h-3 w-3" />
              <span>Assigned & ongoing</span>
            </span>
          </div>

          {/* Card 4: Districts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('districtsCovered')}</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <span className="text-3xl font-extrabold text-indigo-500 dark:text-indigo-400 leading-none">{stats.districts}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">Tamil Nadu region count</span>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE MAP SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight m-0">
            Live Verified Cases Map
          </h3>
          <button 
            onClick={() => navigate('/map-view')}
            className="text-xs font-semibold text-primary dark:text-blue-400 hover:underline flex items-center space-x-1"
          >
            <span>Fullscreen map</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {loading ? (
          <div className="h-[350px] bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-200/30 dark:border-slate-800/30">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <TNMap issues={allVerifiedIssues} height="350px" />
        )}
      </section>

      {/* 4. LATEST VERIFIED ISSUES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight m-0">
            {t('latestVerified')}
          </h3>
          <button 
            onClick={() => navigate('/feed')}
            className="text-xs font-semibold text-primary dark:text-blue-400 hover:underline flex items-center space-x-1"
          >
            <span>View all reports</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-slate-150/40 dark:bg-slate-900/40 border border-slate-200/20 rounded-2xl h-72 animate-pulse"></div>
            ))}
          </div>
        ) : recentIssues.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 text-center text-slate-500">
            <p className="text-sm">{t('noIssues')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentIssues.map(issue => (
              <div key={issue._id}>
                <IssueCard issue={issue} onUpvote={handleUpvote} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
