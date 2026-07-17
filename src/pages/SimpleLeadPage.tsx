import React, { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { toast } from 'react-hot-toast';
import { addLead } from '../hooks/useLeads';

export default function SimpleLeadPage() {
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: '',
    phone: '',
    email: '',
    class: '',
    board: '',
    subjects: '',
    location: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentName || !formData.phone) {
      toast.error('Student Name and Phone are required');
      return;
    }

    setSaving(true);
    try {
      await addLead({
        studentName: formData.studentName,
        parentName: formData.parentName || undefined,
        phone: formData.phone,
        email: formData.email || undefined,
        class: formData.class || 'Not Specified',
        board: formData.board || 'CBSE',
        subjects: formData.subjects ? formData.subjects.split(',').map(s => s.trim()) : [],
        location: formData.location || '',
        notes: formData.notes || undefined,
        source: 'external',
        status: 'new',
        urgency: 'medium',
        mode: 'both',
        genderPreference: 'no_preference',
        zone: '',
        zoneId: '',
        area: '',
        areaId: '',
        subArea: '',
        subAreaId: '',
        preferredTimings: '',
        budget: '',
        startDate: '',
        assignedCounsellor: '',
        selectedTutor: '',
        followUpDate: '',
      });
      
      toast.success('Lead submitted successfully!');
      setFormData({
        studentName: '',
        parentName: '',
        phone: '',
        email: '',
        class: '',
        board: '',
        subjects: '',
        location: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error('Failed to submit lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Add New Lead">
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-semibold text-foreground mb-6">Add New Lead</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Student Name *</label>
                <Input
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  placeholder="Enter student name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Parent Name</label>
                <Input
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  placeholder="Enter parent name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone *</label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Class</label>
                <Select 
                  value={formData.class} 
                  onValueChange={(v) => handleSelectChange('class', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Class 1</SelectItem>
                    <SelectItem value="2">Class 2</SelectItem>
                    <SelectItem value="3">Class 3</SelectItem>
                    <SelectItem value="4">Class 4</SelectItem>
                    <SelectItem value="5">Class 5</SelectItem>
                    <SelectItem value="6">Class 6</SelectItem>
                    <SelectItem value="7">Class 7</SelectItem>
                    <SelectItem value="8">Class 8</SelectItem>
                    <SelectItem value="9">Class 9</SelectItem>
                    <SelectItem value="10">Class 10</SelectItem>
                    <SelectItem value="11">Class 11</SelectItem>
                    <SelectItem value="12">Class 12</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Board</label>
                <Select 
                  value={formData.board} 
                  onValueChange={(v) => handleSelectChange('board', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select board" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBSE">CBSE</SelectItem>
                    <SelectItem value="ICSE">ICSE</SelectItem>
                    <SelectItem value="ISC">ISC</SelectItem>
                    <SelectItem value="State">State Board</SelectItem>
                    <SelectItem value="IB">IB</SelectItem>
                    <SelectItem value="IGCSE">IGCSE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subjects (comma separated)</label>
              <Input
                name="subjects"
                value={formData.subjects}
                onChange={handleChange}
                placeholder="e.g. Mathematics, Science, English"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter location/area"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional information..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Submitting...' : 'Submit Lead'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}