import React, { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { toast } from 'react-hot-toast';
import { addTutor } from '../hooks/useTutors';

export default function SimpleTutorPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    qualification: '',
    subjects: '',
    classes: '',
    experience: '',
    feeRange: '',
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
    
    if (!formData.name || !formData.phone) {
      toast.error('Name and Phone are required');
      return;
    }

    setSaving(true);
    try {
      await addTutor({
        tutorId: `TUT-${Date.now()}`,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        presentQualification: formData.qualification,
        subjectsHandled: formData.subjects ? formData.subjects.split(',').map(s => s.trim()) : [],
        classesHandled: formData.classes ? formData.classes.split(',').map(s => s.trim()) : [],
        teachingExperience: formData.experience,
        feeRange: formData.feeRange,
        location: formData.location,
        notes: formData.notes || undefined,
        preferredMode: 'both',
        isActive: true,
        rating: 0,
        ratingComment: '',
        zone: '',
        area: '',
        subArea: '',
        zoneId: '',
        areaId: '',
        subAreaId: '',
        alternatePhone: '',
        whatsapp: '',
        dob: '',
        presentAddress: '',
        permanentAddress: '',
        lastQualification: '',
        class12Board: 'CBSE',
        isSchoolOrCollegeTeacher: false,
        schoolOrCollegeName: '',
        photoBase64: '',
        availability: '',
        preferredSlots: '',
      });
      
      toast.success('Tutor added successfully!');
      setFormData({
        name: '',
        phone: '',
        email: '',
        qualification: '',
        subjects: '',
        classes: '',
        experience: '',
        feeRange: '',
        location: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding tutor:', error);
      toast.error('Failed to add tutor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Add New Tutor">
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-semibold text-foreground mb-6">Add New Tutor</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter tutor name"
                  required
                />
              </div>
              
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Qualification</label>
                <Input
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="e.g. B.Sc, M.A"
                />
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
              <label className="text-sm font-medium">Classes (comma separated)</label>
              <Input
                name="classes"
                value={formData.classes}
                onChange={handleChange}
                placeholder="e.g. 10, 11, 12"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Experience</label>
                <Input
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="e.g. 5 years"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Fee Range</label>
                <Input
                  name="feeRange"
                  value={formData.feeRange}
                  onChange={handleChange}
                  placeholder="e.g. ₹500-₹800/hr"
                />
              </div>
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
                {saving ? 'Adding...' : 'Add Tutor'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}