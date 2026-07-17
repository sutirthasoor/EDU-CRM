import { useState, useMemo } from 'react';
import { Plus, Search, Filter, X, AlertCircle, CheckCircle } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTasks, addTask, updateTask, deleteTask } from '../hooks/useTasks';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';
import TaskFormModal from '../components/tasks/TaskFormModal';
import TaskTableRow from '../components/tasks/TaskTableRow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import toast from 'react-hot-toast';

type TaskStatus = 'pending' | 'in_progress' | 'completed';
type TaskPriority = 'high' | 'medium' | 'low';

export default function TasksPage() {
  const { tasks, loading: tasksLoading } = useTasks();
  const { userRole, user } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  // Get counselors (users with role counsellor, admin, superadmin)
  const counselors = useMemo(() => {
    if (!users) return [];
    // Filter users who are counselors, admins, or superadmins
    return users.filter(u => 
      u.role === 'counsellor' || 
      u.role === 'admin' || 
      u.role === 'superadmin'
    );
  }, [users]);

  // Debug log to see what users are loaded
  console.log('All users from Firebase:', users);
  console.log('Filtered counselors:', counselors);

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  // Get unique assigned counselors for filter
  const uniqueAssignees = useMemo(() => {
    if (!tasks) return [];
    const assigneeIds = new Set(tasks.map(t => t.assignedTo).filter(Boolean));
    return counselors.filter(c => assigneeIds.has(c.id));
  }, [tasks, counselors]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      const matchesSearch = !searchTerm ||
        task.taskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.taskId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesAssignedTo = assignedToFilter === 'all' || task.assignedTo === assignedToFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignedTo;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, assignedToFilter]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (priorityFilter !== 'all') count++;
    if (assignedToFilter !== 'all') count++;
    return count;
  }, [statusFilter, priorityFilter, assignedToFilter]);

  const resetFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssignedToFilter('all');
    setSearchTerm('');
  };

  const handleAddTask = async (data: any) => {
    if (!isAdmin) {
      toast.error('Only admins can create tasks');
      return;
    }
    setSaving(true);
    try {
      await addTask(data);
      setIsAddModalOpen(false);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleEditTask = async (data: any) => {
    if (!editingTask) return;
    setSaving(true);
    try {
      await updateTask(editingTask.id, data);
      setEditingTask(null);
      setIsAddModalOpen(false);
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    if (!isAdmin) {
      toast.error('Only admins can change task status');
      return;
    }
    try {
      await updateTask(id, { status });
      toast.success('Task status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteTask(deleteConfirm.id);
      toast.success('Task deleted successfully');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setIsAddModalOpen(true);
  };

  // Stats
  const totalTasks = filteredTasks.length;
  const pendingTasks = filteredTasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
  const highPriorityTasks = filteredTasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

  const isLoading = tasksLoading || usersLoading;

  return (
    <AppLayout title="Task Management">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Task Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and track tasks assigned to counselors
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
              <Plus size={16} />
              New Task
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-primary">{totalTasks}</p>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-yellow-600">{pendingTasks}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-blue-600">{inProgressTasks}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-red-600">{highPriorityTasks}</p>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by task name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter size={14} />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={resetFilters} className="flex items-center gap-2">
                <X size={14} />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-lg border border-border">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="in_progress">🔄 In Progress</SelectItem>
                    <SelectItem value="completed">✅ Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">🔴 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Assigned To</label>
                <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Counselors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Counselors</SelectItem>
                    {uniqueAssignees.map(counselor => (
                      <SelectItem key={counselor.id} value={counselor.id}>{counselor.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Tasks Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[100px]">Task ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[200px]">Task Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[150px]">Assigned To</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[200px]">About Task</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[80px]">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[100px]">Deadline</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[100px]">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[120px]">Remarks</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[80px]">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-muted rounded w-20" />
                         </td>
                      ))}
                     </tr>
                  ))
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
                      <CheckCircle size={32} className="mx-auto mb-2 text-muted-foreground/30" />
                      {searchTerm || activeFilterCount > 0 ? 'No tasks match your filters' : 'No tasks found. Create your first task!'}
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => (
                    <TaskTableRow
                      key={task.id}
                      task={task}
                      onEdit={openEditModal}
                      onDelete={setDeleteConfirm}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? handleEditTask : handleAddTask}
        initial={editingTask}
        loading={saving}
        counselors={counselors}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle size={18} />
              Delete Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this task?
            </p>
            {deleteConfirm && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-foreground">{deleteConfirm.taskName}</p>
                <p className="text-xs text-muted-foreground">Task ID: {deleteConfirm.taskId}</p>
              </div>
            )}
            <p className="text-xs text-red-600">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTask}>Delete Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}