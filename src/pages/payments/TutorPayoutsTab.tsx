import { useState, useEffect, useCallback, useRef } from 'react';
import { PlusCircle, Search, X, Loader2 } from 'lucide-react';
import type { Tutor } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { addPayment, generateInvoiceNumber, getTutorPaymentSummary } from '../../hooks/usePayments';
import { Input } from '../../components/ui/input';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface PayoutRow { 
  tutorId: string; 
  sessions: string; 
  rate: string; 
  commission: string; 
  status: 'pending' | 'paid';
  payable?: number;
}

interface Props { tutors: Tutor[] }

export default function TutorPayoutsTab({ tutors }: Props) {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Tutor[]>([]);
  const [searching, setSearching] = useState(false);
  const [tutorSummaries, setTutorSummaries] = useState<Map<string, { total: number; paid: number; pending: number }>>(new Map());
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [newRow, setNewRow] = useState<PayoutRow>({ 
    tutorId: '', 
    sessions: '', 
    rate: '', 
    commission: '10', 
    status: 'pending' 
  });
  const [showTutorDropdown, setShowTutorDropdown] = useState(false);
  const [tutorSearchTerm, setTutorSearchTerm] = useState('');
  const [tutorSearchResults, setTutorSearchResults] = useState<Tutor[]>([]);
  const [searchingTutor, setSearchingTutor] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const tutorSearchTimeoutRef = useRef<NodeJS.Timeout>();

  // Search tutors in database (for main search bar)
  const searchTutorsInDatabase = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    const searchLower = term.toLowerCase().trim();
    
    try {
      const queries = [
        query(collection(db, 'tutors'), where('name', '>=', searchLower), where('name', '<=', searchLower + '\uf8ff'), limit(20)),
        query(collection(db, 'tutors'), where('tutorId', '>=', searchLower), where('tutorId', '<=', searchLower + '\uf8ff'), limit(20)),
        query(collection(db, 'tutors'), where('phone', '>=', searchLower), where('phone', '<=', searchLower + '\uf8ff'), limit(20)),
        query(collection(db, 'tutors'), where('email', '>=', searchLower), where('email', '<=', searchLower + '\uf8ff'), limit(20)),
      ];
      
      const results = await Promise.all(queries.map(q => getDocs(q)));
      
      const allResults: Tutor[] = [];
      const seenIds = new Set();
      
      results.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          if (!seenIds.has(doc.id)) {
            seenIds.add(doc.id);
            allResults.push({ id: doc.id, ...doc.data() } as Tutor);
          }
        });
      });
      
      setSearchResults(allResults);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  // Search tutors for dropdown (when adding payout)
  const searchTutorsForDropdown = useCallback(async (term: string) => {
    if (!term.trim()) {
      setTutorSearchResults([]);
      return;
    }
    
    setSearchingTutor(true);
    const searchLower = term.toLowerCase().trim();
    
    try {
      const queries = [
        query(collection(db, 'tutors'), where('name', '>=', searchLower), where('name', '<=', searchLower + '\uf8ff'), limit(20)),
        query(collection(db, 'tutors'), where('tutorId', '>=', searchLower), where('tutorId', '<=', searchLower + '\uf8ff'), limit(20)),
        query(collection(db, 'tutors'), where('phone', '>=', searchLower), where('phone', '<=', searchLower + '\uf8ff'), limit(20)),
        query(collection(db, 'tutors'), where('email', '>=', searchLower), where('email', '<=', searchLower + '\uf8ff'), limit(20)),
      ];
      
      const results = await Promise.all(queries.map(q => getDocs(q)));
      
      const allResults: Tutor[] = [];
      const seenIds = new Set();
      
      results.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          if (!seenIds.has(doc.id)) {
            seenIds.add(doc.id);
            allResults.push({ id: doc.id, ...doc.data() } as Tutor);
          }
        });
      });
      
      setTutorSearchResults(allResults);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchingTutor(false);
    }
  }, []);

  // Debounced search for main search
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchTutorsInDatabase(term);
    }, 300);
  }, [searchTutorsInDatabase]);

  // Debounced search for dropdown
  const handleTutorSearchChange = useCallback((term: string) => {
    setTutorSearchTerm(term);
    setShowTutorDropdown(true);
    if (term === '') {
      setNewRow({ ...newRow, tutorId: '' });
      setTutorSearchResults([]);
    }
    if (tutorSearchTimeoutRef.current) clearTimeout(tutorSearchTimeoutRef.current);
    tutorSearchTimeoutRef.current = setTimeout(() => {
      searchTutorsForDropdown(term);
    }, 300);
  }, [searchTutorsForDropdown, newRow]);

  // Load summaries only for displayed tutors (not all)
  useEffect(() => {
    const loadSummariesForTutors = async (tutorsList: Tutor[]) => {
      if (tutorsList.length === 0) return;
      
      setLoadingSummaries(true);
      const summaries = new Map(tutorSummaries);
      
      for (const tutor of tutorsList) {
        if (!summaries.has(tutor.id)) {
          const summary = await getTutorPaymentSummary(tutor.id);
          summaries.set(tutor.id, summary);
        }
      }
      
      setTutorSummaries(summaries);
      setLoadingSummaries(false);
      setLoaded(true);
    };
    
    const tutorsToLoad = searchTerm ? searchResults : tutors.slice(0, 30);
    if (tutorsToLoad.length > 0 && !loaded) {
      loadSummariesForTutors(tutorsToLoad);
    }
  }, [searchTerm, searchResults, tutors]);

  const calcPayable = (r: PayoutRow) => {
    const sessions = Number(r.sessions) || 0;
    const rate = Number(r.rate) || 0;
    const commission = Number(r.commission) || 0;
    const gross = sessions * rate;
    return gross - (gross * commission) / 100;
  };

  const handleAdd = async () => {
    if (!newRow.tutorId || !newRow.sessions || !newRow.rate) {
      toast.error('Please fill all required fields');
      return;
    }
    const selectedTutor = searchResults.find(t => t.id === newRow.tutorId) || tutors.find(t => t.id === newRow.tutorId);
    const payable = calcPayable(newRow);
    
    try {
      await addPayment({
        leadId: '',
        studentName: `Payout: ${selectedTutor?.name || newRow.tutorId}`,
        tutorId: newRow.tutorId,
        amount: payable,
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        type: 'payout',
        invoiceNumber: generateInvoiceNumber(),
        mode: 'bank_transfer',
      });
      
      setRows((prev) => [...prev, { ...newRow, payable }]);
      setNewRow({ tutorId: '', sessions: '', rate: '', commission: '10', status: 'pending' });
      setTutorSearchTerm('');
      setTutorSearchResults([]);
      setAdding(false);
      setShowTutorDropdown(false);
      toast.success('Payout added successfully');
    } catch (error) {
      console.error('Error adding payout:', error);
      toast.error('Failed to add payout');
    }
  };

  const handleSelectTutor = (tutor: Tutor) => {
    setNewRow({ ...newRow, tutorId: tutor.id });
    setTutorSearchTerm(`${tutor.name} (${tutor.tutorId})`);
    setShowTutorDropdown(false);
  };

  const displayedTutors = searchTerm ? searchResults : tutors.slice(0, 30);

  return (
    <div className="space-y-4">
      {/* Search Bar - searches database like NewPaymentModal */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Search tutors by name, ID, email, phone..." 
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8 h-8"
        />
        {searching && (
          <Loader2 size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {searchTerm && !searching && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSearchResults([]);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Add Payout Button */}
      <div className="flex justify-end">
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors">
          <PlusCircle size={14} /> Add Payout
        </button>
      </div>

      {/* Add Payout Form */}
      {adding && (
        <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">New Tutor Payout</p>
          
          {/* Tutor Selection with Search */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-foreground">Select Tutor *</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, tutor ID, email, phone..."
                value={tutorSearchTerm}
                onChange={(e) => handleTutorSearchChange(e.target.value)}
                onFocus={() => setShowTutorDropdown(true)}
                className="pl-9"
              />
              {searchingTutor && (
                <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
              {tutorSearchTerm && !searchingTutor && (
                <button
                  type="button"
                  onClick={() => {
                    setTutorSearchTerm('');
                    setTutorSearchResults([]);
                    setNewRow({ ...newRow, tutorId: '' });
                    setShowTutorDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            {/* Tutor Dropdown Results */}
            {showTutorDropdown && tutorSearchTerm && (
              <div className="border border-border rounded-lg max-h-48 overflow-y-auto divide-y divide-border bg-card shadow-lg">
                {searchingTutor ? (
                  <div className="p-3 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Searching...
                  </div>
                ) : tutorSearchResults.length === 0 ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    No tutors found matching "{tutorSearchTerm}"
                  </div>
                ) : (
                  tutorSearchResults.map((tutor) => (
                    <button
                      key={tutor.id}
                      type="button"
                      onClick={() => handleSelectTutor(tutor)}
                      className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{tutor.name}</p>
                          <p className="text-xs text-muted-foreground">{tutor.tutorId} • {tutor.phone}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
            
            {/* Selected Tutor Display */}
            {newRow.tutorId && !showTutorDropdown && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {[...searchResults, ...tutors].find(t => t.id === newRow.tutorId)?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[...searchResults, ...tutors].find(t => t.id === newRow.tutorId)?.tutorId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRow({ ...newRow, tutorId: '' });
                      setTutorSearchTerm('');
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Sessions *</label>
              <input type="number" value={newRow.sessions} onChange={(e) => setNewRow({ ...newRow, sessions: e.target.value })} placeholder="0"
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/60" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Rate / Session (₹) *</label>
              <input type="number" value={newRow.rate} onChange={(e) => setNewRow({ ...newRow, rate: e.target.value })} placeholder="0"
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/60" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Commission (%)</label>
              <input type="number" value={newRow.commission} onChange={(e) => setNewRow({ ...newRow, commission: e.target.value })} placeholder="10"
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/60" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground font-medium">Payable: <strong>{formatCurrency(calcPayable(newRow))}</strong></span>
            <button onClick={handleAdd} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium">Save</button>
            <button onClick={() => {
              setAdding(false);
              setTutorSearchTerm('');
              setTutorSearchResults([]);
              setShowTutorDropdown(false);
            }} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
          </div>
        </div>
      )}

      {/* Tutors Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tutor Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tutor ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paid</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pending</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {searching && searchTerm ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <Loader2 size={24} className="animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Searching tutors...</p>
                  </td>
                </tr>
              ) : displayedTutors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    {searchTerm ? `No tutors found matching "${searchTerm}"` : 'No tutors available'}
                  </td>
                </tr>
              ) : (
                displayedTutors.map((tutor) => {
                  const summary = tutorSummaries.get(tutor.id);
                  return (
                    <tr key={tutor.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium text-foreground">{tutor.name}</td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{tutor.tutorId}</td>
                      <td className="px-4 py-3">
                        <span className="status-badge bg-emerald-100 text-emerald-800">
                          {summary ? formatCurrency(summary.paid) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="status-badge bg-amber-100 text-amber-800">
                          {summary ? formatCurrency(summary.pending) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setNewRow({ ...newRow, tutorId: tutor.id });
                            setTutorSearchTerm(`${tutor.name} (${tutor.tutorId})`);
                            setAdding(true);
                          }}
                          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          Add Payout
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}