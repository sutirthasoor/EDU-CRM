import { useState, useMemo } from 'react';
import {
  Plus, Edit, Trash2, Search, BookOpen, ToggleLeft, ToggleRight, GraduationCap,
  ChevronUp, ChevronDown
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
import { useClasses, addClass, updateClass, deleteClass, toggleClassStatus } from '../hooks/useClasses';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'pre-primary', label: 'Pre-Primary' },
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'higher-secondary', label: 'Higher Secondary' },
  { value: 'college', label: 'College' },
  { value: 'competitive', label: 'Competitive Exam' },
];

export default function ClassesPage() {
  const { classes, loading } = useClasses();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    category: 'primary',
    order: 0,
  });
  const [saving, setSaving] = useState(false);

  // 🔍 DEBUG LOGS
  console.log('='.repeat(50));
  console.log('📚 ClassesPage RENDERED');
  console.log('📚 classes from hook:', classes);
  console.log('📚 classes length:', classes?.length);
  console.log('📚 loading:', loading);
  console.log('📚 search term:', search);
  console.log('='.repeat(50));

  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    
    console.log('🔍 Filtering classes with search:', search);
    const filtered = classes.filter(c => 
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(search.toLowerCase())
    );
    console.log('🔍 Filtered classes count:', filtered.length);
    return filtered;
  }, [classes, search]);

  const resetForm = () => {
    setFormData({ name: '', displayName: '', category: 'primary', order: 0 });
    setEditingClass(null);
  };

  const handleEdit = (cls: any) => {
    console.log('✏️ Editing class:', cls);
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      displayName: cls.displayName || cls.name,
      category: cls.category || 'primary',
      order: cls.order || 0,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        console.log('🗑️ Deleting class:', id);
        await deleteClass(id);
      } catch (error) {
        console.error('Error deleting class:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      console.log('🔄 Toggling class status:', id, !currentStatus);
      await toggleClassStatus(id, !currentStatus);
    } catch (error) {
      console.error('Error toggling class status:', error);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    // Reorder logic - you can implement if needed
    console.log('⬆️ Move up:', index);
  };

  const handleMoveDown = (index: number) => {
    if (index === filteredClasses.length - 1) return;
    // Reorder logic - you can implement if needed
    console.log('⬇️ Move down:', index);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Class name is required');
      return;
    }

    setSaving(true);
    try {
      if (editingClass) {
        console.log('📝 Updating class:', editingClass.id, formData);
        await updateClass(editingClass.id, {
          name: formData.name,
          displayName: formData.displayName || formData.name,
          category: formData.category,
          order: formData.order,
        });
        toast.success('Class updated successfully');
      } else {
        console.log('📝 Adding new class:', formData);
        await addClass({
          name: formData.name,
          displayName: formData.displayName || formData.name,
          category: formData.category as any,
          order: classes.length + 1,
          isActive: true,
        });
        toast.success('Class added successfully');
      }
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving class:', error);
      toast.error('Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Class Management">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Class Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage classes for leads and tutors
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} className="mr-2" />
            Add Class
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading classes...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p>No classes found</p>
            <p className="text-sm">
              {search ? `No results for "${search}"` : 'Click "Add Class" to create your first class'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((cls, index) => (
              <div
                key={cls.id}
                className={cn(
                  'bg-card border border-border rounded-xl p-4 shadow-sm transition-all hover:shadow-md',
                  !cls.isActive && 'opacity-60 bg-muted/30'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={16} className="text-primary" />
                      <h3 className="font-semibold text-foreground">{cls.displayName || cls.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{cls.name}</p>
                    
                    {cls.category && (
                      <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {CATEGORIES.find(c => c.value === cls.category)?.label || cls.category}
                      </span>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Order: {cls.order || index + 1}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {/* Reorder buttons */}
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-muted rounded disabled:opacity-30"
                      title="Move Up"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === filteredClasses.length - 1}
                      className="p-1 hover:bg-muted rounded disabled:opacity-30"
                      title="Move Down"
                    >
                      <ChevronDown size={14} />
                    </button>
                    
                    {/* Toggle status */}
                    <button
                      onClick={() => handleToggleStatus(cls.id, cls.isActive)}
                      className="p-1 hover:bg-muted rounded"
                      title={cls.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {cls.isActive ? (
                        <ToggleRight size={16} className="text-primary" />
                      ) : (
                        <ToggleLeft size={16} className="text-muted-foreground" />
                      )}
                    </button>
                    
                    {/* Edit button */}
                    <button
                      onClick={() => handleEdit(cls)}
                      className="p-1 hover:bg-muted rounded"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(cls.id)}
                      className="p-1 hover:bg-muted rounded text-destructive hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Class Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Class Name (Code) *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. 10, 11, 12, College"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">Internal code/identifier</p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Display Name</label>
              <Input
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. Class 10, Higher Secondary"
              />
              <p className="text-xs text-muted-foreground mt-1">How it appears in dropdowns</p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
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

            <div>
              <label className="text-sm font-medium mb-1 block">Display Order</label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editingClass ? 'Update' : 'Add Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}