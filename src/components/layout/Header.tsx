import { Bell, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import NotificationModal from '../notifications/NotificationModal';
import { usePayments } from '../../hooks/usePayments';
import { useLeads } from '../../hooks/useLeads';

interface HeaderProps {
  title: string;
  onNewLead?: () => void;
}

export default function Header({ title, onNewLead }: HeaderProps) {
  const { user } = useAuth();
  const { payments } = usePayments();
  const { leads } = useLeads();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Calculate notification count
  const pendingPayments = payments?.filter(p => p.status === 'pending' || p.status === 'overdue') || [];
  
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  const upcomingDemos = leads?.filter(lead => {
    if (!lead.demoDate) return false;
    const demoDate = new Date(lead.demoDate);
    return demoDate >= today && demoDate <= nextWeek;
  }) || [];

  const notificationCount = pendingPayments.length + upcomingDemos.length;

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <header className="h-16 bg-card border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
        {/* Left: Page title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* New Lead button */}
          {onNewLead && (
            <button
              onClick={onNewLead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-sm"
            >
              <Plus size={15} />
              <span>New Lead</span>
            </button>
          )}

          {/* Notification bell - NOW OPENS MODAL */}
          <button 
            onClick={() => setNotificationsOpen(true)}
            className="relative w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Bell size={18} />
            {/* Badge - only shows if there are notifications */}
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-card" />
            )}
          </button>

          {/* User avatar + name */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground text-xs font-semibold">{initials}</span>
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block max-w-[120px] truncate">
              {displayName}
            </span>
          </div>
        </div>
      </header>

      {/* Notification Modal */}
      <NotificationModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
}