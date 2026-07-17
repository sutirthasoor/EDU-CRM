import { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Search, BookOpen, ToggleLeft, ToggleRight,
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { useSubjects, addSubject, updateSubject, deleteSubject, toggleSubjectStatus } from '../hooks/useSubjects';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'language', label: 'Language' },
  { value: 'science', label: 'Science' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'arts', label: 'Arts' },
  { value: 'other', label: 'Other' },
];

export default function SubjectsPage() {
  const { subjects, loading } = useSubjects();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'academic',
  });
  const [saving, setSaving] = useState(false);

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ name: '', category: 'academic' });
    setEditingSubject(null);
  };

  const handleEdit = (subject: any) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      category: subject.category || 'academic',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await deleteSubject(id);
      } catch (error) {
        console.error('Error deleting subject:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleSubjectStatus(id, !currentStatus);
    } catch (error) {
      console.error('Error toggling subject status:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    setSaving(true);
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, {
          name: formData.name,
          category: formData.category,
        });
      } else {
        await addSubject({
          name: formData.name,
          category: formData.category as any,
          isActive: true,
        });
      }
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving subject:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Subject Management">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Subject Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage subjects for leads and tutors
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} className="mr-2" />
            Add Subject
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Subjects Grid */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading subjects...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                className={cn(
                  'bg-card border border-border rounded-xl p-4 shadow-sm transition-all',
                  !subject.isActive && 'opacity-60 bg-muted/30'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{subject.name}</h3>
                    {subject.category && (
                      <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {subject.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleToggleStatus(subject.id, subject.isActive)}
                      title={subject.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {subject.isActive ? (
                        <ToggleRight size={16} className="text-primary" />
                      ) : (
                        <ToggleLeft size={16} className="text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(subject)}
                      title="Edit"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(subject.id)}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredSubjects.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                <p>No subjects found</p>
                <p className="text-sm">Click "Add Subject" to create your first subject</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Subject Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Subject Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Mathematics"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category (Optional)</label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editingSubject ? 'Update' : 'Add Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}