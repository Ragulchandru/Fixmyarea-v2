import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import IssueCard from '../components/IssueCard';
import { Search, Filter, RefreshCw, SlidersHorizontal } from 'lucide-react';

const CommunityFeed = () => {
  const { t } = useAuth();
  const navigate = useNavigate();

  // Feed State
  const [issues, setIssues] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('latest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch initial districts
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await axios.get('/api/geography/districts');
        if (res.data.success) {
          setDistricts(res.data.districts);
        }
      } catch (e) {
        console.error('Failed to load districts', e);
      }
    };
    fetchDistricts();
  }, []);

  // Fetch feed issues whenever filters change
  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search;
      if (category) params.category = category;
      if (districtId) params.districtId = districtId;
      if (status) params.status = status;
      if (sort) params.sort = sort;

      const res = await axios.get('/api/issues/verified', { params });
      if (res.data.success) {
        setIssues(res.data.issues);
      }
    } catch (e) {
      console.error('Failed to fetch verified issues', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [category, districtId, status, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIssues();
  };

  const handleUpvote = async (issueId) => {
    try {
      const res = await axios.post(`/api/issues/upvote/${issueId}`);
      if (res.data.success) {
        setIssues(prev => prev.map(issue => 
          issue._id === issueId ? { ...issue, upvotes: res.data.upvotes } : issue
        ));
      }
    } catch (e) {
      if (e.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setDistrictId('');
    setStatus('');
    setSort('latest');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* 1. SEARCH & FILTERS HEADER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-3xl shadow-sm space-y-4">
        
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex space-x-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search reports by keyword (e.g. pothole, garbage)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="bg-primary hover:bg-primary/95 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-primary/15 cursor-pointer"
          >
            Search
          </button>
          
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 p-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
          </button>
        </form>

        {/* Filters desktop / toggle mobile */}
        <div className={`${showMobileFilters ? 'block' : 'hidden'} lg:block pt-3 border-t border-slate-100 dark:border-slate-800/80`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            
            {/* Category Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 pl-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
              >
                <option value="">All Categories</option>
                <option value="pothole">Pothole / Road damage</option>
                <option value="garbage">Garbage dumping</option>
                <option value="streetlight">Broken streetlight</option>
                <option value="water_leakage">Water pipe leakage</option>
                <option value="sewage">Sewage overflow</option>
                <option value="road_damage">Encroachments</option>
                <option value="safety">Public safety concerns</option>
                <option value="other">Other complaints</option>
              </select>
            </div>

            {/* District Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 pl-1">District</label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
              >
                <option value="">All Districts</option>
                {districts.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 pl-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Sorting */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 pl-1">Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
              >
                <option value="latest">Latest Reports</option>
                <option value="upvotes">Most Upvoted</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full bg-slate-55 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 border border-slate-200/50 dark:border-slate-800/80 rounded-xl py-2 px-3 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* 2. RESULTS FEED GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-slate-150/40 dark:bg-slate-900/40 border border-slate-200/20 rounded-2xl h-80 animate-pulse"></div>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-12 rounded-3xl text-center text-slate-500 shadow-sm">
          <Filter className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-850 dark:text-white m-0">No matching reports</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">No public reports match your query. Try resetting filters or choosing another district.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map(issue => (
            <div key={issue._id} className="h-full">
              <IssueCard issue={issue} onUpvote={handleUpvote} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default CommunityFeed;
