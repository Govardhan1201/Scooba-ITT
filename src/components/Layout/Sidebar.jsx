import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp, ACTIONS } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, Calendar, Users, Layers,
  BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  CheckSquare, Activity
} from 'lucide-react';

export default function Sidebar() {
  const { state, dispatch, logout } = useApp();
  const collapsed = state.sidebarCollapsed;

  const toggleSidebar = () => dispatch({ type: ACTIONS.TOGGLE_SIDEBAR });

  const getLinks = () => {
    const role = state.currentUser?.role;
    const base = role === 'HOD' ? '/hod' : role === 'ASST_HOD' ? '/asst-hod' : '/faculty';

    if (role === 'HOD' || role === 'ASST_HOD') {
      return [
        { to: `${base}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
        { to: `${base}/timetable`, icon: Calendar, label: 'Timetable Builder' },
        { to: `${base}/workload`, icon: BarChart3, label: 'Workload' },
        { to: `${base}/optimization`, icon: Activity, label: 'Optimization' },
        { to: `${base}/approvals`, icon: CheckSquare, label: 'Approvals', badge: state.absences.filter(a => a.status === 'PENDING_HOD').length },
        { to: `${base}/faculty`, icon: Users, label: 'Faculty' },
        { to: `${base}/academic-setup`, icon: Layers, label: 'Academic Setup' },
        { to: `${base}/settings`, icon: Settings, label: 'Settings' },
      ];
    }

    if (role === 'FACULTY') {
      return [
        { to: '/faculty/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
        { to: '/faculty/timetable', icon: Calendar, label: 'My Timetable' },
        { to: '/faculty/workload', icon: BarChart3, label: 'My Workload' },
        { to: '/faculty/profile', icon: Users, label: 'My Profile' },
      ];
    }

    return [];
  };

  const links = getLinks();

  return (
    <motion.div 
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="relative h-full bg-[var(--surface-1)] border-r border-[var(--border)] flex flex-col z-20 shadow-xl"
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shrink-0 shadow-lg shadow-[var(--primary)]/20">
            <Layers className="w-6 h-6 text-black" />
          </div>
          <motion.span 
            animate={{ opacity: collapsed ? 0 : 1, display: collapsed ? 'none' : 'block' }}
            className="text-[var(--primary)] font-bold text-xl font-heading tracking-tight"
          >
            PS-08 System
          </motion.span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2 scrollbar-thin">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
              isActive 
                ? "text-black font-semibold shadow-md"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            )}
            title={collapsed ? link.label : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] z-0" 
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <link.icon className={cn("w-5 h-5 z-10 shrink-0 transition-colors", isActive ? "text-black" : "text-[var(--primary-light)] group-hover:text-[var(--primary)]")} />
                <motion.span 
                  animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
                  className="z-10 whitespace-nowrap font-medium flex-1"
                >
                  {link.label}
                </motion.span>
                {!collapsed && link.badge > 0 && (
                  <motion.span
                    animate={{ opacity: collapsed ? 0 : 1 }}
                    className={cn("z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none", isActive ? "bg-black/30 text-black" : "bg-red-500 text-white")}
                  >
                    {link.badge}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-[var(--border)] shrink-0">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-950/30 hover:text-red-300 w-full transition-colors overflow-hidden"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <motion.span animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }} className="font-medium whitespace-nowrap">
            Logout
          </motion.span>
        </button>
      </div>

      <button 
        onClick={toggleSidebar}
        className="absolute -right-4 top-20 bg-[var(--surface-2)] border border-[var(--border)] rounded-full p-1.5 text-[var(--text-secondary)] hover:text-[var(--primary)] shadow-md z-30 transition-transform hover:scale-110"
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
          <ChevronLeft className="w-4 h-4" />
        </motion.div>
      </button>
    </motion.div>
  );
}
