import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Maintenance = () => {
  const { maintenanceMsg, t } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
      
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-amber-500/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
        
        <div className="relative space-y-4">
          
          {/* Logo/Icon */}
          <div className="mx-auto h-16 w-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center animate-pulse">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-4 m-0">
            System Maintenance
          </h1>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            {maintenanceMsg || 'FixMyArea is currently undergoing scheduled updates and optimizations. We will be back online shortly.'}
          </p>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs text-slate-500 leading-normal">
            State administrators and municipal operators can log in using the bypass link below to manage allocations.
          </div>

          <div className="pt-4">
            <button
              onClick={() => navigate('/login')}
              className="mx-auto bg-primary hover:bg-primary/95 text-white font-semibold py-2.5 px-6 rounded-xl text-xs transition-all shadow-md shadow-primary/20 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>Admin / Operator Login</span>
            </button>
          </div>

        </div>

      </div>

      <div className="text-[10px] text-slate-400 dark:text-slate-600 mt-6 font-mono tracking-wide">
        FixMyArea State Portal &bull; Government of Tamil Nadu
      </div>

    </div>
  );
};

export default Maintenance;
