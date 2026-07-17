import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { usePendingTutors } from '../../hooks/useTutors';
import { CheckSquare } from 'lucide-react'; // Add this import
import {
  LayoutDashboard,
  Users,
  BookUser,
  Shuffle,
  CalendarCheck,
  IndianRupee,
  Ticket,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  MapPin,
  BookOpen,
  HelpCircle,
  GraduationCap,
  Building2, // Add this for university icon
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Leads', icon: Users, path: '/leads', group: 'LEADS & STUDENTS' },
  { label: 'Tutor Database', icon: BookUser, path: '/tutors', group: 'TUTORS' },
  { label: 'Tutor Matching', icon: Shuffle, path: '/matching' },
  { label: 'Pending Approvals', icon: Users, path: '/pending-tutors', group: 'ADMIN' },
  { label: 'Demo Scheduling', icon: CalendarCheck, path: '/demos', group: 'SCHEDULING' },
  { label: 'Payments & Finance', icon: IndianRupee, path: '/payments', group: 'FINANCE' },
  { label: 'Support Tickets', icon: Ticket, path: '/tickets', group: 'OPERATIONS' },
  { label: 'Reports & Analytics', icon: BarChart3, path: '/reports' },
  { label: 'Locations', icon: MapPin, path: '/locations', group: 'ADMIN' },
  { label: 'Settings', icon: Settings, path: '/settings', group: 'ADMIN' },
  { label: 'Subjects', icon: BookOpen, path: '/subjects', group: 'ADMIN' },
  { label: 'Classes', icon: GraduationCap, path: '/classes', group: 'ADMIN' },
  { label: 'Universities', icon: Building2, path: '/universities', group: 'ADMIN' }, // Added Universities
  { label: 'Help Center', icon: HelpCircle, path: '/help', group: 'SUPPORT' },
  { label: 'Tasks', icon: CheckSquare, path: '/tasks', group: 'OPERATIONS' }, // Add this line
];

export default function Sidebar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { user, userRole, logout } = useAuth();
  const { pendingTutors } = usePendingTutors();
  const pendingCount = pendingTutors.filter(t => t.status === 'pending').length;

  // 🔍 DEBUG LOGS
  console.log('=== SIDEBAR DEBUG ===');
  console.log('User:', user);
  console.log('User Role:', userRole);
  console.log('Current Path:', currentPath);
  console.log('NAV_ITEMS:', NAV_ITEMS);
  
  const visibleItems = NAV_ITEMS.filter((item) => {
    // For debugging - log each item
    console.log(`Filtering ${item.label}:`, {
      path: item.path,
      userRole,
      isAdminRoute: item.path === '/settings' || item.path === '/locations' || item.path === '/universities' || item.path === '/subjects' || item.path === '/classes',
      shouldShow: item.path === '/settings' || item.path === '/locations' || item.path === '/universities' || item.path === '/subjects' || item.path === '/classes'
        ? userRole === 'admin' || userRole === 'superadmin' || userRole === null // Allow null for now
        : true
    });
    
    // Show admin routes if user is admin, superadmin, OR if role is null (for testing)
    if (item.path === '/settings' || item.path === '/locations' || item.path === '/universities' || item.path === '/subjects' || item.path === '/classes') {
      return userRole === 'admin' || userRole === 'superadmin' || userRole === null;
    }
    return true;
  });

  console.log('Visible Items:', visibleItems.map(i => i.label));
  console.log('====================');

  // Group nav items — track which groups have been rendered
  const renderedGroups = new Set<string>();

  const getRoleLabel = (role: string | null) => {
    if (role === 'superadmin') return 'Super Admin';
    if (role === 'admin') return 'Admin';
    if (role === 'counsellor') return 'Counsellor';
    return 'User';
  };

  const getRoleBadgeClass = (role: string | null) => {
    if (role === 'superadmin') return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    if (role === 'admin') return 'bg-blue-500/20 text-blue-300 border border-blue-400/30';
    return 'bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border';
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="w-64 h-screen bg-sidebar flex flex-col flex-shrink-0 border-r border-sidebar-border">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-sidebar-primary-foreground text-sm font-bold tracking-tight">EC</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sidebar-foreground font-semibold text-sm">Excellence</span>
            <span className="text-sidebar-foreground/60 text-xs font-medium">Consultants</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 text-white">
        {visibleItems.map((item) => {
          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
          const showGroupLabel = item.group && !renderedGroups.has(item.group);
          if (item.group) renderedGroups.add(item.group);

          return (
            <div key={item.path}>
              {showGroupLabel && (
                <div className="px-3 pt-4 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35 select-none">
                    {item.group}
                  </span>
                </div>
              )}
              <Link
                to={item.path}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 relative',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary pl-[10px]'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground border-l-2 border-transparent'
                )}
              >
                <item.icon
                  size={16}
                  className={cn(
                    'flex-shrink-0 transition-colors',
                    isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && (
                  <ChevronRight size={12} className="text-sidebar-primary/70 flex-shrink-0" />
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="flex-shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md bg-sidebar-accent/40">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sidebar-primary-foreground text-xs font-semibold">{initials}</span>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-xs font-medium truncate">{displayName}</p>
            <span className={cn('inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-sm mt-0.5', getRoleBadgeClass(userRole))}>
              {getRoleLabel(userRole)}
            </span>
          </div>
          {/* Logout */}
          <button
            onClick={() => logout()}
            title="Logout"
            className="w-7 h-7 rounded-md flex items-center justify-center text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}