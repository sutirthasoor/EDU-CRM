import React, { useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import type { Tutor } from '@/types';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

type CsvRow = Omit<Tutor, 'id' | 'createdAt' | 'updatedAt'>;

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (rows: CsvRow[]) => void;
  loading?: boolean;
}

export default function CsvImportModal({ open, onClose, onImport, loading }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📁 File selected:', file.name);
    setFileName(file.name);
    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        console.log('📊 Raw data:', result.data);
        console.log('📊 Headers:', result.meta.fields);
        
        try {
          const data = result.data as any[];
          
          // Filter out completely empty rows
          const nonEmptyRows = data.filter(row => 
            Object.values(row).some(val => val && String(val).trim() !== '')
          );
          
          console.log('📊 Non-empty rows:', nonEmptyRows.length);

          const mapped: CsvRow[] = nonEmptyRows
  .map((obj) => {
    // Helper function to get values - UPDATED for your current headers
    const get = (key: string) => {
      return obj[key]?.toString().trim() || '';
    };

    // Log what we're getting for debugging
    console.log('📋 Processing row:', {
      name: get('Name'),  // Changed from 'Name ' to 'Name'
      phone: get('Phone Number'),
      zone: get('Zone'),
      area: get('Area'),
      subArea: get('Subareas'),
      tutorCode: get('Tutor Code'),
      subjects: get('Subject Taught'),
      fee: get('Expected Fees(Rs.)'),
      rating: get('Rating'),
      level: get('Level'),
      documentsVerified: get('Documents Verified')
    });

    // Parse subjects - handle comma or pipe separated
    const subjectsString = get('Subject Taught');
    const subjects = subjectsString
      ? subjectsString.split(/[,|/]/).map(s => s.trim()).filter(Boolean)
      : [];

    // Parse classes/segments
    const segmentString = get('Segment');
    const classesHandled = segmentString
      ? segmentString.split(/[,|/]/).map(s => s.trim()).filter(Boolean)
      : [];

    // Clean phone numbers
    const cleanPhone = (phone: string) => {
      return phone.replace(/[^\d]/g, '').slice(0, 10);
    };

    // Parse rating from strings like "3 Star" or "4 Star"
    const parseRating = (ratingStr: string): number => {
      if (!ratingStr) return 0;
      const match = ratingStr.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    };

    return {
      tutorId: get('Tutor Code') || `TMP-${Date.now()}`,
      name: get('Name') || '',  // Changed from 'Name ' to 'Name'
      phone: cleanPhone(get('Phone Number')) || '',
      alternatePhone: cleanPhone(get('Alternate Phone')) || '',
      whatsapp: cleanPhone(get('Whatsapp Number')) || '',
      dob: get('DOB') || '',
      email: get('Email id') || '',
      presentAddress: get('Address') || '',
      permanentAddress: get('Address') || '',
      
      // Location fields
      zone: get('Zone') || '',
      area: get('Area') || '',
      subArea: get('Subareas') || '',
      
      presentQualification: get('Qualification') || '',
      lastQualification: get('Qualification') || '',
      class12Board: get('Schooling Board') || '',
      
      subjectsHandled: subjects,
      classesHandled: classesHandled,
      
      teachingExperience: get('Level') || '',
      availability: '',
      preferredSlots: '',
      feeRange: get('Expected Fees(Rs.)') || '',
      location: get('Area of Tuitions :-') || [get('Subareas'), get('Area'), get('Zone')].filter(Boolean).join(', '),
      preferredMode: 'both',
      
      isSchoolOrCollegeTeacher: false,
      schoolOrCollegeName: '',
      
      rating: parseRating(get('Rating')),
      ratingComment: '',
      
      isActive: get('Documents Verified')?.toLowerCase().includes('y') || false,
      
      // Required fields with defaults
      class12SchoolName: '',
      class12Year: '',
      class12Stream: '',
      presentCollegeName: '',
      presentYear: '',
      presentStatus: '',
      lastCollegeName: '',
      lastYear: '',
      extraQualification: '',
      extraCourseName: '',
      extraInstituteName: '',
      extraYear: '',
      photoBase64: '',
      zoneId: '',
      areaId: '',
      subAreaId: '',
    };
  })
  .filter(row => {
    // Only keep rows with name AND phone
    const isValid = row.name && row.name.trim() !== '' && 
                   row.phone && row.phone.trim() !== '';
    
    if (!isValid) {
      console.log('❌ Invalid row:', { 
        name: row.name, 
        phone: row.phone,
        fullRow: row 
      });
    } else {
      console.log('✅ Valid row:', row.name, row.phone);
    }
    
    return isValid;
  });

          console.log('✅ Valid rows:', mapped.length);
          
          if (mapped.length === 0) {
            setError('No valid rows found. Name and Phone are required.');
            setRows([]);
            return;
          }

          setRows(mapped);
          toast.success(`Found ${mapped.length} valid tutors`);
          
        } catch (err) {
          console.error('❌ Parse error:', err);
          setError('Failed to parse CSV. Check console for details.');
        }
      },
      error: (error) => {
        console.error('❌ Papa parse error:', error);
        setError('Error reading CSV file.');
      }
    });
  };

  const handleClose = () => { 
    setRows([]); 
    setFileName(''); 
    setError(''); 
    onClose(); 
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent 
  className="w-full max-h-[85vh] overflow-y-auto" 
  style={{ maxWidth: '1400px' }}
>
        <DialogHeader>
          <DialogTitle>Import Tutors from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={28} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">{fileName || 'Click to choose CSV file'}</p>
            <p className="text-xs text-muted-foreground mt-1">Accepts .csv files only</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg p-3">
              <AlertCircle size={14} />{error}
            </div>
          )}

          {rows.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-emerald-600" />
                <span className="text-sm font-medium text-foreground">{rows.length} tutors ready to import</span>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        {['Name', 'Phone', 'Zone', 'Area', 'Subjects', 'Fee'].map((h) => (
                          <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((r, i) => (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium">{r.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{r.phone}</td>
                          <td className="px-3 py-2 text-muted-foreground">{r.zone}</td>
                          <td className="px-3 py-2 text-muted-foreground">{r.area}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {r.subjectsHandled.slice(0, 2).join(', ')}
                            {r.subjectsHandled.length > 2 ? '…' : ''}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{r.feeRange || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={() => onImport(rows)} disabled={rows.length === 0 || loading}>
            {loading ? 'Importing…' : `Import ${rows.length} Tutor${rows.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}