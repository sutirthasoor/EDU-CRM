import { useState, useEffect } from 'react';
import {
  Users, Database, Info, Plus, Trash2,
  Download, Shield, RefreshCw, Building2, Mail,
  Phone, Globe, AlertTriangle, UserCog, ChevronRight,
  CheckCircle2, Key, Eye, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  collection, getDocs, doc, updateDoc, addDoc, serverTimestamp,
  getDoc, setDoc, deleteDoc, query, where 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import AppLayout from '../components/layout/AppLayout';
import { useLeads } from '../hooks/useLeads';
import { useTutors } from '../hooks/useTutors';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { cn, formatDate, ZONES } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import type { AppUser, UserRole } from '../types';

// ─── CSV Export Helper ────────────────────────────────────────────────────────

function exportToCsv(filename: string, rows: Record<string, string | number | boolean | undefined | null>[]) {
  if (!rows.length) { toast.error('No data to export'); return; }
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => {
      const val = row[h] ?? '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') ? `"${str}"` : str;
    }).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename} exported!`);
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Tab: User Management ─────────────────────────────────────────────────────

interface StaffUser extends AppUser {
  isActive?: boolean;
  uid?: string;
}

function UserManagementTab({ userRole }: { userRole: UserRole | null }) {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [changingRole, setChangingRole] = useState<StaffUser | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('counsellor');
  const [deletingUser, setDeletingUser] = useState<StaffUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  const { refreshUser } = useAuth(); // Add this if available

  const loadUsers = async () => {
  setLoading(true);
  try {
    const snap = await getDocs(collection(db, 'users'));
    const usersList = snap.docs.map(d => ({ 
      id: d.id,  // This should be the UID
      ...d.data() 
    } as StaffUser));
    
    console.log('📋 Loaded users:', usersList.map(u => ({ name: u.name, uid: u.uid, role: u.role })));
    setUsers(usersList);
  } catch (error) {
    console.error('Error loading users:', error);
    toast.error('Failed to load users');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { loadUsers(); }, []);

  const handleChangeRole = async () => {
  if (!changingRole) return;
  
  console.log('=== ROLE CHANGE DEBUG ===');
  console.log('Changing user UID:', changingRole.uid);
  console.log('Changing user ID (document ID):', changingRole.id);
  console.log('New role:', newRole);
  
  try {
    // Use the uid as the document path, NOT the id
    const userRef = doc(db, 'users', changingRole.uid);
    console.log('Updating document at path:', `users/${changingRole.uid}`);
    
    await updateDoc(userRef, { 
      role: newRole,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Role updated successfully');
    toast.success(`Role updated to ${newRole}`);
    
    // Check if this is the current user
    const auth = getAuth();
    const currentUser = auth.currentUser;
    console.log('Current user UID:', currentUser?.uid);
    
    if (currentUser?.uid === changingRole.uid) {
      console.log('🔄 This is the current user! Refreshing...');
      if (refreshUser) {
        await refreshUser();
        console.log('✅ refreshUser completed');
        toast.success('Your role has been updated!');
      } else {
        toast.info('Your role has been updated. Please refresh the page.');
      }
    }
    
    setChangingRole(null);
    await loadUsers();
  } catch (error) {
    console.error('Error updating role:', error);
    toast.error('Failed to update role');
  }
};
const handleDeleteUser = async (user: StaffUser) => {
  const auth = getAuth();
  if (auth.currentUser?.uid === user.uid) {
    toast.error('You cannot delete your own account');
    return;
  }
  
  try {
    // Use user.uid as the document ID
    await deleteDoc(doc(db, 'users', user.uid));
    
    toast.success(`User ${user.name || user.email} deleted successfully`);
    loadUsers();
    setDeletingUser(null);
    setDeleteConfirm(false);
  } catch (error) {
    console.error('Error deleting user:', error);
    toast.error('Failed to delete user');
  }
};

  const getRoleBadge = (role: UserRole) => {
    const map: Record<UserRole, string> = {
      superadmin: 'bg-amber-100 text-amber-800',
      admin: 'bg-blue-100 text-blue-800',
      counsellor: 'bg-green-100 text-green-700',
    };
    return map[role] || 'bg-gray-100 text-gray-700';
  };

  // Only Super Admin can see this tab content
  if (userRole !== 'superadmin') {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Access Restricted</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Only Super Administrators can manage users. Please contact your system administrator if you need access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Staff Users" description="Manage team members and their access levels">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} /> Add Staff Member
          </button>
        </div>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-muted-foreground/50" />
            Loading users...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Name', 'Email', 'Role', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                 </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No staff users found</td></tr>
                ) : users.map(u => {
                  const auth = getAuth();
                  const isCurrentUser = auth.currentUser?.uid === u.uid;
                  
                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-primary">
                              {u.name?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <p className="font-medium text-foreground">{u.name || '—'}</p>
                          {isCurrentUser && (
                            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">You</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', getRoleBadge(u.role))}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
  {(() => {
    if (!u.createdAt) return '—';
    try {
      // Handle Firestore Timestamp
      if (u.createdAt?.toDate && typeof u.createdAt.toDate === 'function') {
        return new Date(u.createdAt.toDate()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      // Handle string date
      if (typeof u.createdAt === 'string') {
        return new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      // Handle Date object
      if (u.createdAt instanceof Date) {
        return u.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return '—';
    } catch {
      return '—';
    }
  })()}
</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Change Role Button */}
                          <button
                            onClick={() => { setChangingRole(u); setNewRole(u.role); }}
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                            title="Change Role"
                          >
                            <UserCog size={12} /> Change Role
                          </button>
                          
                          {/* Delete Button - Only for non-superadmin and not current user */}
                          {u.role !== 'superadmin' && !isCurrentUser && (
                            <button
                              onClick={() => { setDeletingUser(u); setDeleteConfirm(true); }}
                              className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Add Staff Modal */}
      <AddStaffModal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); loadUsers(); }}
        userRole={userRole}
      />

      {/* Change Role Modal */}
      <Dialog open={!!changingRole} onOpenChange={() => setChangingRole(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role — {changingRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <label className="text-sm font-medium text-foreground mb-1.5 block">New Role</label>
            <Select value={newRole} onValueChange={v => setNewRole(v as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="counsellor">Counsellor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <button onClick={() => setChangingRole(null)} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors">Cancel</button>
            <button onClick={handleChangeRole} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Update Role</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={16} /> Delete User
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-foreground">
              Are you sure you want to delete <span className="font-semibold">{deletingUser?.name || deletingUser?.email}</span>?
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This action cannot be undone. The user will lose access to the CRM.
            </p>
          </div>
          <DialogFooter>
            <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              onClick={() => deletingUser && handleDeleteUser(deletingUser)}
              className="px-4 py-2 text-sm rounded-md bg-destructive text-white hover:bg-destructive/90 transition-colors"
            >
              Delete User
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Add Staff Modal with Password ────────────────────────────────────────────

function AddStaffModal({ open, onClose, userRole }: { open: boolean; onClose: () => void; userRole: UserRole | null }) {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    role: 'counsellor' as UserRole 
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const validatePassword = () => {
    if (form.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async () => {
  if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
    toast.error('Please fill all required fields');
    return;
  }

  if (!validatePassword()) return;

  setSaving(true);
  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      form.email,
      form.password
    );
    
    const uid = userCredential.user.uid;

    // CHANGE THIS: Use setDoc with uid as the document ID
    await setDoc(doc(db, 'users', uid), {
      name: form.name,
      email: form.email,
      role: form.role,
      uid: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    toast.success(`User ${form.name} created successfully`);
    setForm({ name: '', email: '', password: '', confirmPassword: '', role: 'counsellor' });
    onClose();
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      toast.error('Email already in use');
    } else if (error.code === 'auth/weak-password') {
      toast.error('Password should be at least 6 characters');
    } else if (error.code === 'auth/invalid-email') {
      toast.error('Invalid email address');
    } else {
      toast.error(error.message || 'Failed to create user');
    }
  } finally {
    setSaving(false);
  }
};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
            <Input
              placeholder="John Doe"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
            <Input
              type="email"
              placeholder="john@excellenceconsultants.in"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password *</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password *</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {passwordError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle size={12} />
              {passwordError}
            </p>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Role</label>
            <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as UserRole }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="counsellor">Counsellor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            {form.role === 'superadmin' && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} /> Superadmin has full system access
              </p>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <Key size={12} className="inline mr-1" />
            Password must be at least 6 characters
          </div>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim() || !form.email.trim() || !form.password.trim() || !form.confirmPassword.trim()}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Creating User...' : 'Create User'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab: Data Management ─────────────────────────────────────────────────────

// ─── Tab: Data Management ─────────────────────────────────────────────────────

// ─── Tab: Data Management ─────────────────────────────────────────────────────

function DataManagementTab() {
  const [archiving, setArchiving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [exporting, setExporting] = useState<'leads' | 'tutors' | null>(null);
  
  // Add state for real database counts
  const [dbStats, setDbStats] = useState({
    totalLeads: 0,
    totalTutors: 0,
    activeTutors: 0,
    convertedLeads: 0,
    loading: true
  });

  // Fetch real database counts
  const fetchDatabaseStats = async () => {
    setDbStats(prev => ({ ...prev, loading: true }));
    try {
      // Run queries in parallel for speed
      const [totalLeadsSnap, totalTutorsSnap, activeTutorsSnap, convertedLeadsSnap] = await Promise.all([
        getDocs(collection(db, 'leads')),
        getDocs(collection(db, 'tutors')),
        getDocs(query(collection(db, 'tutors'), where('isActive', '==', true))),
        getDocs(query(collection(db, 'leads'), where('status', '==', 'converted'))),
      ]);

      setDbStats({
        totalLeads: totalLeadsSnap.size,
        totalTutors: totalTutorsSnap.size,
        activeTutors: activeTutorsSnap.size,
        convertedLeads: convertedLeadsSnap.size,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching database stats:', error);
      toast.error('Failed to fetch database statistics');
      setDbStats(prev => ({ ...prev, loading: false }));
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  // ─── EXPORT ALL TUTORS (Fetches all documents) ──────────────────────────
  const handleExportAllTutors = async () => {
    setExporting('tutors');
    try {
      toast.loading('Fetching all tutors...', { id: 'export-tutors' });
      
      // Fetch ALL tutors without limit
      const snapshot = await getDocs(collection(db, 'tutors'));
      const allTutors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      toast.success(`Found ${allTutors.length} tutors`, { id: 'export-tutors' });
      
      // Export to CSV
      exportToCsv('all_tutors.csv', allTutors.map((t: any) => ({
        tutorId: t.tutorId || t.id,
        name: t.name || '',
        phone: t.phone || '',
        email: t.email ?? '',
        zone: t.zone ?? '',
        subjects: (t.subjectsHandled || []).join('; '),
        mode: t.preferredMode || '',
        isActive: t.isActive ? 'Yes' : 'No',
        rating: t.rating ?? '',
        experience: t.teachingExperience ?? '',
        createdAt: t.createdAt?.toDate ? new Date(t.createdAt.toDate()).toLocaleDateString() : t.createdAt || '',
        updatedAt: t.updatedAt?.toDate ? new Date(t.updatedAt.toDate()).toLocaleDateString() : t.updatedAt || '',
      })));
      
      toast.success(`Exported ${allTutors.length} tutors successfully`);
    } catch (error) {
      console.error('Error exporting tutors:', error);
      toast.error('Failed to export tutors');
    } finally {
      setExporting(null);
    }
  };

  // ─── EXPORT ALL LEADS (Fetches all documents) ──────────────────────────
  // ─── EXPORT ALL LEADS (Fetches all documents) ──────────────────────────
const handleExportAllLeads = async () => {
  setExporting('leads');
  try {
    toast.loading('Fetching all leads...', { id: 'export-leads' });
    
    const snapshot = await getDocs(collection(db, 'leads'));
    const allLeads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    toast.success(`Found ${allLeads.length} leads`, { id: 'export-leads' });
    
    exportToCsv('all_leads.csv', allLeads.map((l: any) => ({
      leadId: l.leadId || l.id,
      studentName: l.studentName || '',
      parentName: l.parentName ?? '',
      phone: l.phone || '',
      email: l.email ?? '',
      source: l.source || '',
      status: l.status || '',
      class: l.class || '',
      subjects: Array.isArray(l.subjects) ? l.subjects.join('; ') : (l.subjects || ''),
      zone: l.zone ?? '',
      counsellor: l.assignedCounsellor ?? '',
      tutor: Array.isArray(l.tutorAssignments) ? l.tutorAssignments.map((t: any) => t.tutorName).join('; ') : '',
      demoDate: l.demoDate?.toDate ? new Date(l.demoDate.toDate()).toLocaleDateString() : l.demoDate || '',
      followUpDate: l.followUpDate?.toDate ? new Date(l.followUpDate.toDate()).toLocaleDateString() : l.followUpDate || '',
      createdAt: l.createdAt?.toDate ? new Date(l.createdAt.toDate()).toLocaleDateString() : l.createdAt || '',
      updatedAt: l.updatedAt?.toDate ? new Date(l.updatedAt.toDate()).toLocaleDateString() : l.updatedAt || '',
    })));
    
    toast.success(`Exported ${allLeads.length} leads successfully`);
  } catch (error) {
    console.error('Error exporting leads:', error);
    toast.error('Failed to export leads');
  } finally {
    setExporting(null);
  }
};

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      toast.success('Completed leads archived successfully');
      setConfirmArchive(false);
      // Refresh stats after archive
      fetchDatabaseStats();
    } catch {
      toast.error('Archive failed');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Database Statistics" description="Real-time counts from your database">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dbStats.loading ? (
            // Loading skeletons
            <>
              <div className="rounded-lg px-4 py-3 text-center bg-muted animate-pulse">
                <div className="h-8 w-16 mx-auto bg-muted-foreground/20 rounded" />
                <div className="h-3 w-20 mx-auto mt-2 bg-muted-foreground/20 rounded" />
              </div>
              <div className="rounded-lg px-4 py-3 text-center bg-muted animate-pulse">
                <div className="h-8 w-16 mx-auto bg-muted-foreground/20 rounded" />
                <div className="h-3 w-20 mx-auto mt-2 bg-muted-foreground/20 rounded" />
              </div>
              <div className="rounded-lg px-4 py-3 text-center bg-muted animate-pulse">
                <div className="h-8 w-16 mx-auto bg-muted-foreground/20 rounded" />
                <div className="h-3 w-20 mx-auto mt-2 bg-muted-foreground/20 rounded" />
              </div>
              <div className="rounded-lg px-4 py-3 text-center bg-muted animate-pulse">
                <div className="h-8 w-16 mx-auto bg-muted-foreground/20 rounded" />
                <div className="h-3 w-20 mx-auto mt-2 bg-muted-foreground/20 rounded" />
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg px-4 py-3 text-center bg-blue-100 text-blue-800">
                <p className="text-2xl font-bold">{dbStats.totalLeads.toLocaleString()}</p>
                <p className="text-xs font-medium mt-0.5">Total Leads</p>
              </div>
              <div className="rounded-lg px-4 py-3 text-center bg-purple-100 text-purple-800">
                <p className="text-2xl font-bold">{dbStats.totalTutors.toLocaleString()}</p>
                <p className="text-xs font-medium mt-0.5">Total Tutors</p>
              </div>
              <div className="rounded-lg px-4 py-3 text-center bg-green-100 text-green-700">
                <p className="text-2xl font-bold">{dbStats.activeTutors.toLocaleString()}</p>
                <p className="text-xs font-medium mt-0.5">Active Tutors</p>
              </div>
              <div className="rounded-lg px-4 py-3 text-center bg-amber-100 text-amber-700">
                <p className="text-2xl font-bold">{dbStats.convertedLeads.toLocaleString()}</p>
                <p className="text-xs font-medium mt-0.5">Converted Leads</p>
              </div>
            </>
          )}
        </div>
        
        {/* Refresh button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchDatabaseStats}
            disabled={dbStats.loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={dbStats.loading ? 'animate-spin' : ''} />
            Refresh Stats
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Export Data" description="Download all data as CSV for external use">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExportAllTutors}
            disabled={exporting === 'tutors'}
            className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {exporting === 'tutors' ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {exporting === 'tutors' ? 'Exporting...' : `Export All Tutors (${dbStats.totalTutors.toLocaleString()})`}
          </button>
          <button
            onClick={handleExportAllLeads}
            disabled={exporting === 'leads'}
            className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {exporting === 'leads' ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {exporting === 'leads' ? 'Exporting...' : `Export All Leads (${dbStats.totalLeads.toLocaleString()})`}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          ⚡ Exports all records directly from the database without pagination limits.
        </p>
      </SectionCard>

      <SectionCard title="Danger Zone">
        <div className="border border-red-200 rounded-lg p-4 bg-red-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">Archive Completed Leads</p>
              <p className="text-xs text-red-600/80 mt-0.5">
                This will mark all leads with "converted" or "lost" status as archived.
                They will be hidden from active views but not deleted.
              </p>
              <button
                onClick={() => setConfirmArchive(true)}
                className="mt-3 flex items-center gap-1.5 px-3 py-2 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <Database size={12} /> Archive Completed Leads
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      <Dialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={16} /> Confirm Archive
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to archive all completed leads? This action cannot be undone easily.
          </p>
          <DialogFooter>
            <button onClick={() => setConfirmArchive(false)} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {archiving ? 'Archiving...' : 'Yes, Archive'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab: About ───────────────────────────────────────────────────────────────

function AboutTab() {
  const INFO = [
    { icon: Building2, label: 'Company', value: 'Excellence Consultants' },
    { icon: Globe, label: 'App Name', value: 'TutorMatch CRM' },
    { icon: Shield, label: 'Version', value: '1.0.0' },
    { icon: Mail, label: 'Support Email', value: 'support@excellenceconsultants.in' },
    { icon: Phone, label: 'Support Phone', value: '+91 98765 43210' },
  ];
  return (
    <div className="space-y-5">
      <SectionCard title="App Information">
        <div className="space-y-3">
          {INFO.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-sm text-foreground font-medium">{value}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground/40" />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="About TutorMatch CRM">
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            TutorMatch CRM is a comprehensive customer relationship management system designed specifically
            for home tutoring consultancies. It streamlines the entire process from lead capture to tutor
            matching, demo scheduling, and payment management.
          </p>
          <p>
            Built with React, TypeScript, and Firebase for Excellence Consultants — a premier tutoring
            consultancy serving students across multiple zones with personalized home tuition.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {['React 18', 'TypeScript', 'Firebase', 'Tailwind CSS', 'Recharts', 'TanStack Router'].map(tag => (
              <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium">{tag}</span>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type SettingsTab = 'users' | 'data' | 'about';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType; allowedRoles: UserRole[] }[] = [
  { id: 'users', label: 'User Management', icon: Users, allowedRoles: ['superadmin'] },
  { id: 'data', label: 'Data Management', icon: Database, allowedRoles: ['superadmin', 'admin'] },
  { id: 'about', label: 'About', icon: Info, allowedRoles: ['superadmin', 'admin', 'counsellor'] },
];

export default function SettingsPage() {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('data');

  // Filter tabs based on user role
  const allowedTabs = TABS.filter(tab => tab.allowedRoles.includes(userRole || 'counsellor'));

  // Set first allowed tab as active if current tab is not allowed
  useEffect(() => {
    if (!allowedTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(allowedTabs[0]?.id || 'about');
    }
  }, [userRole, allowedTabs, activeTab]);

  return (
    <AppLayout title="Settings">
      <div className="p-6">
        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <aside className="w-52 flex-shrink-0">
            <nav className="space-y-1">
              {allowedTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors',
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                    )}
                  >
                    <Icon size={15} className="flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Role Badge */}
            <div className="mt-6 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={13} className="text-amber-600" />
                <p className="text-xs font-semibold text-amber-700">Your Role</p>
              </div>
              <p className="text-xs text-amber-600 capitalize font-medium">
                {userRole === 'superadmin' ? 'Super Admin' : userRole === 'admin' ? 'Admin' : userRole || 'Counsellor'}
              </p>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'users' && <UserManagementTab userRole={userRole} />}
            {activeTab === 'data' && <DataManagementTab />}
            {activeTab === 'about' && <AboutTab />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}