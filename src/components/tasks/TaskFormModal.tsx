import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Task } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initial?: Task | null;
  loading?: boolean;
  counselors?: any[];
}

const PRIORITIES = [
  { value: 'high', label: '🔴 High', color: 'text-red-600' },
  { value: 'medium', label: '🟡 Medium', color: 'text-amber-600' },
  { value: 'low', label: '🟢 Low', color: 'text-emerald-600' },
];

const STATUSES = [
  { value: 'pending', label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'in_progress', label: '🔄 In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: '✅ Completed', color: 'bg-green-100 text-green-700' },
];

interface TaskFormData {
  taskName: string;
  assignedTo: string;
  aboutTask: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  remarks: string;
}

const EMPTY: TaskFormData = {
  taskName: '',
  assignedTo: '',
  aboutTask: '',
  priority: 'medium',
  deadline: '',
  status: 'pending',
  remarks: '',
};

export default function TaskFormModal({ open, onClose, onSubmit, initial, loading, counselors = [] }: TaskFormModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<TaskFormData>(EMPTY);
  const [selectedCounselorName, setSelectedCounselorName] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        taskName: initial.taskName || '',
        assignedTo: initial.assignedTo || '',
        aboutTask: initial.aboutTask || '',
        priority: initial.priority || 'medium',
        deadline: initial.deadline || '',
        status: initial.status || 'pending',
        remarks: initial.remarks || '',
      });
      // Find and set the counselor name
      const counselor = counselors.find(c => c.id === initial.assignedTo);
      setSelectedCounselorName(counselor?.name || initial.assignedToName || initial.assignedTo || '');
    } else {
      setForm(EMPTY);
      setSelectedCounselorName('');
    }
  }, [initial, open, counselors]);

  const set = (key: keyof TaskFormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'assignedTo') {
      const counselor = counselors.find(c => c.id === value);
      setSelectedCounselorName(counselor?.name || value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.taskName.trim()) {
      alert('Please enter Task Name');
      return;
    }
    if (!form.assignedTo) {
      alert('Please select a counselor to assign');
      return;
    }
    onSubmit({
      ...form,
      assignedToName: selectedCounselorName,
      createdByName: user?.displayName || user?.email?.split('@')[0] || 'Admin',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 py-4">
            {/* Task Name */}
            <div className="col-span-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Task Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.taskName}
                onChange={(e) => set('taskName', e.target.value)}
                placeholder="Enter task name"
                className="mt-1"
                required
              />
            </div>

            {/* Assigned To - Counselor - Shows names in dropdown */}
            <div className="col-span-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Assign To <span className="text-destructive">*</span>
              </Label>
              <Select value={form.assignedTo} onValueChange={(v) => set('assignedTo', v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select counselor">
                    {selectedCounselorName && (
                      <span className="truncate">{selectedCounselorName}</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {counselors?.map((counselor) => (
                    <SelectItem key={counselor.id} value={counselor.id}>
                      {counselor.name} {counselor.email && `(${counselor.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* About Task */}
            <div className="col-span-2">
              <Label className="text-xs font-medium text-muted-foreground">About Task</Label>
              <Textarea
                value={form.aboutTask}
                onChange={(e) => set('aboutTask', e.target.value)}
                placeholder="Describe the task details, requirements, etc."
                rows={3}
                className="mt-1 resize-none"
              />
            </div>

            {/* Priority and Deadline */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Priority</Label>
              <Select value={form.priority} onValueChange={(v: any) => set('priority', v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className={p.color}>{p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => set('deadline', e.target.value)}
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Status */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v: any) => set('status', v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className={s.color}>{s.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Remarks */}
            <div className="col-span-2">
              <Label className="text-xs font-medium text-muted-foreground">Remarks</Label>
              <Textarea
                value={form.remarks}
                onChange={(e) => set('remarks', e.target.value)}
                placeholder="Additional remarks or notes..."
                rows={2}
                className="mt-1 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}