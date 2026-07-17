import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useZones, useAreas, useSubAreas } from '@/hooks/useLocations';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface LocationSelectorProps {
  value?: {
    zoneId?: string;
    areaId?: string;
    subAreaId?: string;
    zone?: string;
    area?: string;
    subArea?: string;
  };
  onChange: (location: {
    zoneId?: string;
    areaId?: string;
    subAreaId?: string;
    zone?: string;
    area?: string;
    subArea?: string;
  }) => void;
  disabled?: boolean;
}

export default function LocationSelector({ value, onChange, disabled = false }: LocationSelectorProps) {
  const { zones, loading: zonesLoading } = useZones();
  const [selectedZoneId, setSelectedZoneId] = useState<string>(value?.zoneId || '');
  const [selectedAreaId, setSelectedAreaId] = useState<string>(value?.areaId || '');
  
  const { areas, loading: areasLoading } = useAreas(selectedZoneId);
  const { subAreas, loading: subAreasLoading } = useSubAreas(selectedAreaId);

  // Update when props change
  useEffect(() => {
    if (value?.zoneId) setSelectedZoneId(value.zoneId);
    if (value?.areaId) setSelectedAreaId(value.areaId);
  }, [value]);

  const handleZoneChange = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setSelectedAreaId('');
    const zone = zones.find(z => z.id === zoneId);
    onChange({
      zoneId,
      zone: zone?.name || '',
      areaId: undefined,
      area: '',
      subAreaId: undefined,
      subArea: '',
    });
  };

  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId);
    const area = areas.find(a => a.id === areaId);
    onChange({
      zoneId: selectedZoneId,
      zone: zones.find(z => z.id === selectedZoneId)?.name || '',
      areaId,
      area: area?.name || '',
      subAreaId: undefined,
      subArea: '',
    });
  };

  const handleSubAreaChange = (subAreaId: string) => {
    const subArea = subAreas.find(s => s.id === subAreaId);
    onChange({
      zoneId: selectedZoneId,
      zone: zones.find(z => z.id === selectedZoneId)?.name || '',
      areaId: selectedAreaId,
      area: areas.find(a => a.id === selectedAreaId)?.name || '',
      subAreaId,
      subArea: subArea?.name || '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Zone Dropdown */}
      <div className="space-y-2">
        <Label htmlFor="zone">Zone</Label>
        <Select
          value={selectedZoneId}
          onValueChange={handleZoneChange}
          disabled={disabled || zonesLoading}
        >
          <SelectTrigger id="zone">
            <SelectValue placeholder="Select Zone">
  {value?.zone || "Select Zone"}
</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {zonesLoading ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Area Dropdown - Only show if zone is selected */}
      {selectedZoneId && (
        <div className="space-y-2">
          <Label htmlFor="area">Area</Label>
          <Select
            value={selectedAreaId}
            onValueChange={handleAreaChange}
            disabled={disabled || areasLoading}
          >
            <SelectTrigger id="area">
              <SelectValue placeholder="Select Area">
  {value?.area || "Select Area"}
</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {areasLoading ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : areas.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No areas found</div>
              ) : (
                areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Sub Area Dropdown - Only show if area is selected */}
      {selectedAreaId && (
        <div className="space-y-2">
          <Label htmlFor="subArea">Sub Area</Label>
          <Select
            value={value?.subAreaId || ''}
            onValueChange={handleSubAreaChange}
            disabled={disabled || subAreasLoading}
          >
            <SelectTrigger id="subArea">
              <SelectValue placeholder="Select Sub Area">
  {value?.subArea || "Select Sub Area"}
</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {subAreasLoading ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : subAreas.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No sub areas found</div>
              ) : (
                subAreas.map((subArea) => (
                  <SelectItem key={subArea.id} value={subArea.id}>
                    {subArea.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}