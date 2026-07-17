import { useState } from 'react';
import { Plus, MapPin, Edit, Trash2, ChevronRight } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import {
  useZones,
  addZone,
  updateZone,
  deleteZone,
  useAreas,
  addArea,
  updateArea,
  deleteArea,
  useSubAreas,
  addSubArea,
  updateSubArea,
  deleteSubArea,
} from '../hooks/useLocations';
import toast from 'react-hot-toast';

export default function LocationsPage() {
  const [activeTab, setActiveTab] = useState<'zones' | 'areas' | 'subareas'>('zones');
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', pincode: '' });

  const { zones } = useZones();
  const { areas } = useAreas(selectedZone?.id);
  const { subAreas } = useSubAreas(selectedArea?.id);

  const resetForm = () => {
    setFormData({ name: '', description: '', pincode: '' });
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (activeTab === 'zones') {
        if (editingItem) {
          await updateZone(editingItem.id, formData);
        } else {
          await addZone(formData);
        }
      } else if (activeTab === 'areas') {
        if (!selectedZone) {
          toast.error('Please select a zone first');
          return;
        }
        if (editingItem) {
          await updateArea(editingItem.id, {
            name: formData.name,
            description: formData.description,
          });
        } else {
          await addArea({
            ...formData,
            zoneId: selectedZone.id,
            zoneName: selectedZone.name,
            isActive: true,
          });
        }
      } else if (activeTab === 'subareas') {
        if (!selectedArea) {
          toast.error('Please select an area first');
          return;
        }
        if (editingItem) {
          await updateSubArea(editingItem.id, {
            name: formData.name,
            description: formData.description,
            pincode: formData.pincode,
          });
        } else {
          await addSubArea({
            name: formData.name,
            description: formData.description,
            pincode: formData.pincode,
            areaId: selectedArea.id,
            areaName: selectedArea.name,
            zoneId: selectedArea.zoneId,
            zoneName: selectedArea.zoneName,
            isActive: true,
          });
        }
      }
      
      setIsModalOpen(false);
      resetForm();
      toast.success(`${activeTab.slice(0, -1)} saved successfully`);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    }
  };

  const handleDeleteSubArea = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteSubArea(id);
        toast.success('Sub-area deleted successfully');
      } catch (error: any) {
        console.error('Error deleting sub-area:', error);
        // Error message already shown in the deleteSubArea function
      }
    }
  };

  const handleDeleteArea = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also delete all sub-areas in this area.`)) {
      try {
        await deleteArea(id);
      } catch (error) {
        // Error message already shown in the deleteArea function
      }
    }
  };

  const handleDeleteZone = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also delete all areas and sub-areas in this zone.`)) {
      try {
        await deleteZone(id);
      } catch (error) {
        // Error message already shown in the deleteZone function
      }
    }
  };

  return (
    <AppLayout title="Location Management">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Location Management</h1>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            Add {activeTab.slice(0, -1)}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {['zones', 'areas', 'subareas'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors relative ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Hierarchy Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6 p-3 bg-muted/30 rounded-lg">
          <MapPin size={14} className="text-muted-foreground" />
          {selectedZone ? (
            <>
              <button
                onClick={() => {
                  setSelectedZone(null);
                  setSelectedArea(null);
                }}
                className="text-primary hover:underline"
              >
                {selectedZone.name}
              </button>
              <ChevronRight size={14} className="text-muted-foreground" />
            </>
          ) : (
            <span className="text-foreground font-medium">All Zones</span>
          )}
          
          {selectedArea && (
            <>
              <button
                onClick={() => setSelectedArea(null)}
                className="text-primary hover:underline"
              >
                {selectedArea.name}
              </button>
              <ChevronRight size={14} className="text-muted-foreground" />
            </>
          )}
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {activeTab === 'zones' && (
            <ZoneList
              zones={zones}
              onSelect={(zone) => {
                setSelectedZone(zone);
                setActiveTab('areas');
              }}
              onEdit={(zone) => {
                setEditingItem(zone);
                setFormData({ name: zone.name, description: zone.description || '', pincode: '' });
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteZone}
            />
          )}

          {activeTab === 'areas' && (
            <AreaList
              areas={areas}
              zoneName={selectedZone?.name}
              onSelect={(area) => {
                setSelectedArea(area);
                setActiveTab('subareas');
              }}
              onEdit={(area) => {
                setEditingItem(area);
                setFormData({ name: area.name, description: area.description || '', pincode: '' });
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteArea}
            />
          )}

          {activeTab === 'subareas' && (
            <SubAreaList
              subAreas={subAreas}
              areaName={selectedArea?.name}
              onEdit={(subArea) => {
                setEditingItem(subArea);
                setFormData({ 
                  name: subArea.name, 
                  description: subArea.description || '',
                  pincode: subArea.pincode || ''
                });
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteSubArea}
            />
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={`Enter ${activeTab.slice(0, -1)} name`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background resize-none"
                placeholder="Optional description"
              />
            </div>
            {activeTab === 'subareas' && (
              <div>
                <label className="block text-sm font-medium mb-1">Pincode</label>
                <Input
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="Enter pincode"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Zone List Component
function ZoneList({ zones, onSelect, onEdit, onDelete }: any) {
  return (
    <div className="divide-y divide-border">
      {zones.map((zone: any) => (
        <div key={zone.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{zone.name}</h3>
            <p className="text-sm text-muted-foreground">Code: {zone.code}</p>
            {zone.description && (
              <p className="text-xs text-muted-foreground mt-1">{zone.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(zone)}
              className="text-primary"
            >
              View Areas
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(zone)}>
              <Edit size={14} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={() => onDelete(zone.id, zone.name)}
              className="hover:text-destructive"
            >
              <Trash2 size={14} className="text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Area List Component
function AreaList({ areas, zoneName, onSelect, onEdit, onDelete }: any) {
  return (
    <div className="divide-y divide-border">
      {areas.map((area: any) => (
        <div key={area.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{area.name}</h3>
            <p className="text-sm text-muted-foreground">Code: {area.code} | Zone: {zoneName}</p>
            {area.description && (
              <p className="text-xs text-muted-foreground mt-1">{area.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(area)}
              className="text-primary"
            >
              View Sub-areas
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(area)}>
              <Edit size={14} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={() => onDelete(area.id, area.name)}
              className="hover:text-destructive"
            >
              <Trash2 size={14} className="text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// SubArea List Component
function SubAreaList({ subAreas, areaName, onEdit, onDelete }: any) {
  return (
    <div className="divide-y divide-border">
      {subAreas.map((subArea: any) => (
        <div key={subArea.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{subArea.name}</h3>
            <p className="text-sm text-muted-foreground">Area: {areaName}</p>
            {subArea.pincode && (
              <p className="text-xs text-muted-foreground">Pincode: {subArea.pincode}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(subArea)}>
              <Edit size={14} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={() => onDelete(subArea.id, subArea.name)}
              className="hover:text-destructive"
            >
              <Trash2 size={14} className="text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}