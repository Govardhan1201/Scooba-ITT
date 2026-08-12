import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp, ACTIONS } from '../../context/AppContext';
import { 
  LayoutDashboard, Calendar, Users, BookOpen, Layers,
  BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  CheckSquare, Activity
} from 'lucide-react';

export default function Sidebar() {
  const { state, dispatch, logout } = useApp();
  const collapsed = state.sidebarCollapsed;

  const toggleSidebar = () => dispatch({ type: ACTIONS.TOGGLE_SIDEBAR });

  const getLinks = () => {
    switch(state.currentUser?.role) {
      case 'HOD':
        return [
          { to: '/hod/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/hod/timetable', icon: Calendar, label: 'Timetable Builder' },
          { to: '/hod/workload', icon: BarChart3, label: 'Workload' },
          { to: '/hod/optimization', icon: Activity, label: 'Optimization' },
          { to: '/hod/approvals', icon: CheckSquare, label: 'Approvals' },
          { to: '/hod/faculty', icon: Users, label: 'Faculty' },
          { to: '/hod/academic-setup', icon: Layers, label: 'Academic Setup' },
          { to: '/hod/settings', icon: Settings, label: 'Settings' },
        ];
      // Other roles omitted for brevity right now
      default: return [];
    }
  };

  const links = getLinks();

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border)]">
        {!collapsed && (
          <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-xl font-heading">
            <Layers className="w-6 h-6" />
            <span>PS-08</span>
          </div>
        )}
        {collapsed && <Layers className="w-6 h-6 mx-auto text-[var(--primary)]" />}
      </div>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
              ${isActive ? 'bg-[var(--primary)] text-black' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'}
            `}
            title={collapsed ? link.label : undefined}
          >
            <link.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium whitespace-nowrap">{link.label}</span>}
          </NavLink>
        ))}
      </div>

      <div className="p-3 border-t border-[var(--border)]">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-950/30 hover:text-red-300 w-full transition-colors"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium whitespace-nowrap">Logout</span>}
        </button>
      </div>

      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 bg-[var(--surface-2)] border border-[var(--border)] rounded-full p-1 text-[var(--text-secondary)] hover:text-[var(--primary)]"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );
}
