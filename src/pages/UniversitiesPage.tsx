import React, { useState } from 'react';
import { useUniversities, addUniversity, updateUniversity, deleteUniversity } from '@/hooks/useUniversities';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

const UniversityPage = () => {
  const { universities, loading, error } = useUniversities();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'state' as const,
    isActive: true,
  });

  const filteredUniversities = universities?.filter(uni =>
    uni.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast.error('University name is required');
      return;
    }
    try {
      await addUniversity(formData);
      setIsAddModalOpen(false);
      setFormData({ name: '', category: 'state', isActive: true });
    } catch (error) {
      console.error('Error adding university:', error);
    }
  };

  const handleEdit = async () => {
    if (!editingUniversity) return;
    try {
      await updateUniversity(editingUniversity.id, {
        name: formData.name,
        category: formData.category,
        isActive: formData.isActive,
      });
      setEditingUniversity(null);
      setFormData({ name: '', category: 'state', isActive: true });
    } catch (error) {
      console.error('Error updating university:', error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteUniversity(id);
      } catch (error) {
        console.error('Error deleting university:', error);
      }
    }
  };

  const openEditModal = (uni: any) => {
    setEditingUniversity(uni);
    setFormData({
      name: uni.name,
      category: uni.category || 'state',
      isActive: uni.isActive,
    });
  };

  const handleToggleStatus = async (uni: any) => {
    try {
      await updateUniversity(uni.id, { isActive: !uni.isActive });
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-background border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground">Universities Management</h1>
            <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add University
            </Button>
          </div>

          <div className="relative max-w-md mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search universities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredUniversities.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No universities found
                      </td>
                    </tr>
                  ) : (
                    filteredUniversities.map((uni) => (
                      <tr key={uni.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{uni.name}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">
                            {uni.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={uni.isActive ? "default" : "secondary"}>
                            {uni.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(uni)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              <Badge variant="outline" className="text-xs">
                                {uni.isActive ? 'Deactivate' : 'Activate'}
                              </Badge>
                            </button>
                            <button
                              onClick={() => openEditModal(uni)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              <Edit size={16} className="text-blue-500" />
                            </button>
                            <button
                              onClick={() => handleDelete(uni.id, uni.name)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen || !!editingUniversity} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setEditingUniversity(null);
          setFormData({ name: '', category: 'state', isActive: true });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUniversity ? 'Edit University' : 'Add University'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">University Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., University of Calcutta, Jadavpur University"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={formData.category} onValueChange={(v: any) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="state">State University</SelectItem>
                  <SelectItem value="central">Central University</SelectItem>
                  <SelectItem value="private">Private University</SelectItem>
                  <SelectItem value="deemed">Deemed University</SelectItem>
                  <SelectItem value="foreign">Foreign University</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddModalOpen(false);
              setEditingUniversity(null);
            }}>
              Cancel
            </Button>
            <Button onClick={editingUniversity ? handleEdit : handleAdd}>
              {editingUniversity ? 'Save Changes' : 'Add University'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UniversityPage;