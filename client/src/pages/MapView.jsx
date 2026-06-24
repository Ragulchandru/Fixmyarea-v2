import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TNMap from '../components/TNMap';
import { Map, Filter, RefreshCw, Search } from 'lucide-react';

const MapView = () => {
  const { t, isDarkMode } = useAuth();
  const [issues, setIssues] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [category, setCategory] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [status, setStatus] = useState('');

  // Fetch districts list
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await axios.get('/api/geography/districts');
        if (res.data.success) {
          setDistricts(res.data.districts);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchDistricts();
  }, []);

  // Fetch verified issues for the map
  const fetchMapIssues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      if (districtId) params.districtId = districtId;
      if (status) params.status = status;

      const res = await axios.get('/api/issues/verified', { params });
      if (res.data.success) {
        setIssues(res.data.issues);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapIssues();
  }, [category, districtId, status]);

  const handleResetFilters = () => {
    setCategory('');
    setDistrictId('');
    setStatus('');
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2 m-0">
            <Map className="h-6 w-6 text-primary" />
            <span>Interactive State Map</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 pl-0.5">Explore active community complaints plotted on Leaflet OpenStreetMap</p>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-4 rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Category */}
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

          {/* District */}
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

          {/* Status */}
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

          {/* Reset button */}
          <button
            onClick={handleResetFilters}
            className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 border border-slate-200/50 dark:border-slate-850 rounded-xl py-2 px-3 text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* MAP EMBED */}
      {loading ? (
        <div className="h-[500px] bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-200/30 dark:border-slate-800/30">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="shadow-lg rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
          <TNMap issues={issues} height="500px" isDarkMode={isDarkMode} zoom={7} />
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pl-1 font-mono">
        <div>Plotted pins: {issues.length}</div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1"><div className="h-2 w-2 rounded-full bg-red-500"></div><span>Verified</span></div>
          <div className="flex items-center space-x-1"><div className="h-2 w-2 rounded-full bg-blue-500"></div><span>Assigned</span></div>
          <div className="flex items-center space-x-1"><div className="h-2 w-2 rounded-full bg-amber-500"></div><span>In Progress</span></div>
          <div className="flex items-center space-x-1"><div className="h-2 w-2 rounded-full bg-emerald-500"></div><span>Resolved</span></div>
        </div>
      </div>

    </div>
  );
};

export default MapView;
