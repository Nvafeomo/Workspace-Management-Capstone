import React, {useState, useEffect} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Box, 
  CheckSquare, 
  LogOut,
  User as UserIcon,
  Package,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { workspaceApi } from '../api/workspaceApi';



function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  key?: string | number;
}

const SidebarItem = ({ to, icon: Icon, label, active }: SidebarItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
      active 
        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
        : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
    )}
  >
    <Icon size={20} className={cn(active ? "text-white" : "text-slate-400 group-hover:text-indigo-600")} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, globalRole, user   } = useAuth();
  // tracks if the user is an admin or approver in any workspace, used to show/hide the Approvals tab
  const [isApprover, setIsApprover] = useState(false); 
  
  useEffect(() => {
    if (!user?.id) return;
    workspaceApi.getApproverWorkspaces(user.id).then(workspaces => {
      setIsApprover(workspaces.length > 0);
    });
  }, [user?.id, location.pathname]);


  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    //only admins get to see approvals page in sidebar
    ...(globalRole === 'ADMIN' || globalRole === 'MASTER' || isApprover ? [{ to: '/approvals', icon: CheckSquare, label: 'Approvals' }] : []),
    { to: '/my-resources', icon: Package, label: 'My Resources' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Box size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">Workspace</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarItem 
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            active={location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors group"
        >
          <LogOut size={20} className="text-rose-400 group-hover:text-rose-600" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { displayName, user } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Workspace Management</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <UserIcon size={14} />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {displayName ?? user?.email ?? 'User'}
              </span>
            </div>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};
