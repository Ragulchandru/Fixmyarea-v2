import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Award, Shield, Globe, Landmark } from 'lucide-react';

const Profile = () => {
  const { user, lang, changeLanguage, t } = useAuth();

  if (!user) return null;

  const getReputationLabel = (rep) => {
    if (rep >= 100) return 'Civic Guardian';
    if (rep >= 50) return 'Active Citizen';
    if (rep >= 20) return 'Community Voice';
    return 'New Reporter';
  };

  const getReputationColor = (rep) => {
    if (rep >= 100) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    if (rep >= 50) return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    if (rep >= 20) return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30';
    return 'text-slate-500 bg-slate-500/10 border-slate-500/30';
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-12 animate-fade-in space-y-6">
      
      {/* 1. HERO PROFILE CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6">
        
        {/* Avatar */}
        <div className="h-20 w-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center shadow-inner border border-primary/20 shrink-0">
          <User className="h-10 w-10" />
        </div>

        {/* User Info */}
        <div className="space-y-3 flex-1">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white m-0 leading-tight">{user.name}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1.5">
              <span className="text-[9px] font-bold uppercase rounded px-1.5 py-0.5 inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/30 dark:border-slate-800/30">
                {user.role}
              </span>
              <span className={`text-[9px] font-bold uppercase rounded px-1.5 py-0.5 inline-block border ${getReputationColor(user.reputation)}`}>
                {getReputationLabel(user.reputation)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-slate-500 dark:text-slate-400 text-xs">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Landmark className="h-3.5 w-3.5 text-slate-400" />
              <span>State Department of Tamil Nadu</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. REPUTATION & ACHIEVEMENT BADGES */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-850 dark:text-white tracking-tight flex items-center space-x-2 m-0">
          <Award className="h-5 w-5 text-primary" />
          <span>Reputation & Badges</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Reputation score */}
          <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 text-center flex flex-col justify-center">
            <div className="text-3xl font-extrabold text-primary dark:text-blue-400">{user.reputation}</div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-350 mt-1">Reputation Score</div>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-normal">Points earned by upvotes on verified reports and successful resolutions.</p>
          </div>

          {/* Badges */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-450 uppercase tracking-wider pl-1">Earned Badges</div>
            {user.badges && user.badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge, idx) => (
                  <span key={idx} className="bg-primary/5 text-primary dark:bg-blue-500/5 dark:text-blue-400 border border-primary/20 dark:border-blue-500/20 px-3 py-1 rounded-xl text-xs font-semibold flex items-center space-x-1">
                    <Shield className="h-3 w-3 shrink-0" />
                    <span>{badge}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-xs pl-1 italic">
                Report issues and get them verified to unlock badges!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. SETTINGS & PREFERENCES */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-850 dark:text-white tracking-tight flex items-center space-x-2 m-0">
          <Globe className="h-5 w-5 text-primary" />
          <span>Portal Preferences</span>
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-white">Portal Language Preference</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">Choose English or Tamil for interface elements.</p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-850">
            <button
              onClick={() => changeLanguage('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                lang === 'en' 
                  ? 'bg-white text-primary dark:bg-slate-800 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              English
            </button>
            <button
              onClick={() => changeLanguage('ta')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                lang === 'ta' 
                  ? 'bg-white text-primary dark:bg-slate-800 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Profile;
