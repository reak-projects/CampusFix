import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Compass,
  Users,
  Building2,
  Bell,
  CheckSquare,
  BarChart3,
  SlidersHorizontal,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  if (!user) return null;

  const studentLinks = [
    { label: 'Student Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Report New Issue', path: '/report', icon: PlusCircle },
    { label: 'My Reported Issues', path: '/issues?mine=true', icon: FileText },
    { label: 'Explore Campus Feed', path: '/issues', icon: Compass },
    { label: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const staffLinks = [
    { label: 'Staff Dashboard', path: '/staff', icon: LayoutDashboard },
    { label: 'Assigned to Me', path: '/issues?mine=true', icon: CheckSquare },
    { label: 'Department Feed', path: '/issues?department=mine', icon: Building2 },
    { label: 'All Campus Issues', path: '/issues', icon: Compass },
    { label: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const adminLinks = [
    { label: 'Operations Analytics', path: '/admin', icon: BarChart3 },
    { label: 'All Campus Issues', path: '/issues', icon: Compass },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'Departments', path: '/admin/departments', icon: Building2 },
    { label: 'Report Issue', path: '/report', icon: PlusCircle },
    { label: 'Notifications', path: '/notifications', icon: Bell },
  ];

  let links = studentLinks;
  if (user.role === 'staff') links = staffLinks;
  if (user.role === 'admin') links = adminLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {user.role} Navigation
            </p>
            <nav className="space-y-1">
              {links.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom user badge */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Status</span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Connected
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
