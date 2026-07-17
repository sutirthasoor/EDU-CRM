import { Pencil, Trash2, Clock, Flag, CheckCircle, PlayCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';
import type { Task } from '@/types';
import { useUsers } from '@/hooks/useUsers';

interface Props {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
}

const PRIORITY_CONFIG = {
  high: { label: 'High', icon: Flag, color: 'text-red-600 bg-red-50', bg: 'bg-red-100' },
  medium: { label: 'Medium', icon: Flag, color: 'text-amber-600 bg-amber-50', bg: 'bg-amber-100' },
  low: { label: 'Low', icon: Flag, color: 'text-emerald-600 bg-emerald-50', bg: 'bg-emerald-100' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Circle, color: 'text-yellow-600 bg-yellow-50', bg: 'bg-yellow-100' },
  in_progress: { label: 'In Progress', icon: PlayCircle, color: 'text-blue-600 bg-blue-50', bg: 'bg-blue-100' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-600 bg-green-50', bg: 'bg-green-100' },
};

export default function TaskTableRow({ task, onEdit, onDelete, onStatusChange }: Props) {
  const { users } = useUsers();
  const PriorityIcon = PRIORITY_CONFIG[task.priority]?.icon || Flag;
  const StatusIcon = STATUS_CONFIG[task.status]?.icon || Circle;
  
  // Find the assigned counselor's name from users list
  const assignedCounselor = users?.find(u => u.id === task.assignedTo);
  const assignedToName = assignedCounselor?.name || task.assignedToName || task.assignedTo || 'Unknown';
  
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

  return (
    <tr className="hover:bg-muted/30 transition-colors group">
      {/* Task ID */}
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-medium text-primary">{task.taskId}</span>
       </td>
      
      {/* Task Name */}
      <td className="px-4 py-3">
        <p className="font-medium text-foreground">{task.taskName}</p>
      </td>
      
      {/* Assigned To - Now shows name instead of ID */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">
              {assignedToName.charAt(0)}
            </span>
          </div>
          <span className="text-sm">{assignedToName}</span>
        </div>
      </td>
      
      {/* About Task */}
      <td className="px-4 py-3 max-w-[200px]">
        <p className="text-xs text-muted-foreground line-clamp-2">{task.aboutTask || '—'}</p>
      </td>
      
      {/* Priority */}
      <td className="px-4 py-3">
        <span className={cn('text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit', 
          PRIORITY_CONFIG[task.priority]?.bg || 'bg-gray-100'
        )}>
          <PriorityIcon size={10} />
          {PRIORITY_CONFIG[task.priority]?.label || task.priority}
        </span>
      </td>
      
      {/* Deadline */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Clock size={12} className={isOverdue ? 'text-red-500' : 'text-muted-foreground'} />
          <span className={cn('text-sm', isOverdue && 'text-red-500 font-medium')}>
            {task.deadline ? formatDate(task.deadline) : '—'}
          </span>
        </div>
      </td>
      
      {/* Status */}
      <td className="px-4 py-3">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as Task['status'])}
          className={cn('text-xs px-2 py-1 rounded-full border-0 cursor-pointer font-medium',
            STATUS_CONFIG[task.status]?.bg || 'bg-gray-100'
          )}
        >
          <option value="pending">⏳ Pending</option>
          <option value="in_progress">🔄 In Progress</option>
          <option value="completed">✅ Completed</option>
        </select>
      </td>
      
      {/* Remarks */}
      <td className="px-4 py-3 max-w-[150px]">
        <p className="text-xs text-muted-foreground truncate">{task.remarks || '—'}</p>
      </td>
      
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={() => onEdit(task)} title="Edit" className="h-8 w-8 p-0">
            <Pencil size={13} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(task)} 
            title="Delete"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </td>
    </tr>
  );
}