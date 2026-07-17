import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, X, Loader2, GraduationCap, Plus, Trash2, Calculator, Users, DollarSign, User, BookOpen } from 'lucide-react';
import { addPayment, generateInvoiceNumber } from '@/hooks/usePayments';
import { useTutors } from '@/hooks/useTutors';
import { useLeads } from '@/hooks/useLeads';
import toast from 'react-hot-toast';
import type { Tutor, Lead } from '@/types';

interface NewPaymentModalProps {
  open: boolean;
  onClose: () => void;
}

type PaymentMode = 'cash' | 'bank_transfer' | 'upi' | 'card' | 'cheque';

interface LeadTutorAllocation {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone?: string;
  leadClass?: string;
  tutors: {
    tutorId: string;
    tutorName: string;
    tutorPhone?: string;
    subjects?: string[];
    amount: number;
  }[];
}

export default function NewPaymentModal({ open, onClose }: NewPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [allocations, setAllocations] = useState<LeadTutorAllocation[]>([]);
  
  // State for adding a new lead
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  
  // State for adding tutors to a specific lead
  const [tutorSearchTerms, setTutorSearchTerms] = useState<Record<string, string>>({});
  const [showTutorDropdowns, setShowTutorDropdowns] = useState<Record<string, boolean>>({});
  const [selectedTutors, setSelectedTutors] = useState<Record<string, Tutor | null>>({});
  const [tutorAmounts, setTutorAmounts] = useState<Record<string, string>>({});
  
  const [dueDate, setDueDate] = useState('');
  const [mode, setMode] = useState<PaymentMode>('cash');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  
  // Load all leads and tutors
  const { tutors, loading: tutorsLoading } = useTutors();
  const { leads, loading: leadsLoading } = useLeads();
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return allocations.reduce((sum, lead) => 
      sum + lead.tutors.reduce((tSum, tutor) => tSum + tutor.amount, 0), 0
    );
  }, [allocations]);

  // Filter leads based on search
  const filteredLeads = useMemo(() => {
    if (!leadSearchTerm.trim()) return leads;
    const searchLower = leadSearchTerm.toLowerCase();
    return leads.filter(lead =>
      lead.studentName?.toLowerCase().includes(searchLower) ||
      lead.leadId?.toLowerCase().includes(searchLower) ||
      lead.phone?.includes(searchLower) ||
      lead.parentName?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower)
    );
  }, [leads, leadSearchTerm]);

  // Filter tutors for a specific lead
  const getFilteredTutors = useCallback((leadId: string) => {
    const searchTerm = tutorSearchTerms[leadId] || '';
    if (!searchTerm.trim()) return tutors;
    const searchLower = searchTerm.toLowerCase();
    return tutors.filter(tutor =>
      tutor.name?.toLowerCase().includes(searchLower) ||
      tutor.tutorId?.toLowerCase().includes(searchLower) ||
      tutor.phone?.includes(searchLower) ||
      tutor.email?.toLowerCase().includes(searchLower) ||
      tutor.subjectsHandled?.some(s => s.toLowerCase().includes(searchLower))
    );
  }, [tutors, tutorSearchTerms]);

  // Check if tutor is already added to this lead
  const isTutorAdded = useCallback((leadId: string, tutorId: string) => {
    const lead = allocations.find(l => l.id === leadId);
    return lead?.tutors.some(t => t.tutorId === tutorId) || false;
  }, [allocations]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setAllocations([]);
      setSelectedLead(null);
      setLeadSearchTerm('');
      setTutorSearchTerms({});
      setShowTutorDropdowns({});
      setSelectedTutors({});
      setTutorAmounts({});
      setMode('cash');
      setTransactionId('');
      setNotes('');
      setShowLeadDropdown(false);
    } else {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      setDueDate(defaultDueDate.toISOString().split('T')[0]);
    }
  }, [open]);

  // Handle lead selection
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadSearchTerm(`${lead.studentName} (${lead.leadId})`);
    setShowLeadDropdown(false);
  };

  // Add lead with initial empty tutor list
  const handleAddLead = () => {
    if (!selectedLead) {
      toast.error('Please select a student/lead');
      return;
    }
    
    // Check if lead already added
    if (allocations.some(a => a.leadId === selectedLead.id)) {
      toast.error('This student is already added');
      return;
    }
    
    const newAllocation: LeadTutorAllocation = {
      id: selectedLead.id,
      leadId: selectedLead.id,
      leadName: selectedLead.studentName || 'Unknown',
      leadPhone: selectedLead.phone,
      leadClass: selectedLead.class,
      tutors: []
    };
    
    setAllocations(prev => [...prev, newAllocation]);
    setSelectedLead(null);
    setLeadSearchTerm('');
    setShowLeadDropdown(false);
  };

  // Remove lead from allocation
  const handleRemoveLead = (leadId: string) => {
    setAllocations(prev => prev.filter(l => l.id !== leadId));
    // Clean up related states
    setTutorSearchTerms(prev => {
      const newState = { ...prev };
      delete newState[leadId];
      return newState;
    });
    setShowTutorDropdowns(prev => {
      const newState = { ...prev };
      delete newState[leadId];
      return newState;
    });
    setSelectedTutors(prev => {
      const newState = { ...prev };
      delete newState[leadId];
      return newState;
    });
    setTutorAmounts(prev => {
      const newState = { ...prev };
      delete newState[leadId];
      return newState;
    });
  };

  // Handle tutor selection for a specific lead
  const handleSelectTutor = (leadId: string, tutor: Tutor) => {
    setSelectedTutors(prev => ({ ...prev, [leadId]: tutor }));
    setTutorSearchTerms(prev => ({ 
      ...prev, 
      [leadId]: `${tutor.name} (${tutor.tutorId})` 
    }));
    setShowTutorDropdowns(prev => ({ ...prev, [leadId]: false }));
  };

  // Add tutor to a specific lead
  const handleAddTutor = (leadId: string) => {
    const selectedTutor = selectedTutors[leadId];
    if (!selectedTutor) {
      toast.error('Please select a tutor');
      return;
    }
    
    const amountStr = tutorAmounts[leadId] || '';
    const amountNum = parseFloat(amountStr);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    // Check if tutor already added
    if (isTutorAdded(leadId, selectedTutor.id)) {
      toast.error('Tutor already added to this student');
      return;
    }
    
    setAllocations(prev => prev.map(lead => {
      if (lead.id !== leadId) return lead;
      return {
        ...lead,
        tutors: [...lead.tutors, {
          tutorId: selectedTutor.id,
          tutorName: selectedTutor.name,
          tutorPhone: selectedTutor.phone,
          subjects: selectedTutor.subjectsHandled,
          amount: amountNum
        }]
      };
    }));
    
    // Reset tutor selection for this lead
    setSelectedTutors(prev => ({ ...prev, [leadId]: null }));
    setTutorSearchTerms(prev => ({ ...prev, [leadId]: '' }));
    setTutorAmounts(prev => ({ ...prev, [leadId]: '' }));
  };

  // Remove tutor from a specific lead
  const handleRemoveTutor = (leadId: string, tutorId: string) => {
    setAllocations(prev => prev.map(lead => {
      if (lead.id !== leadId) return lead;
      return {
        ...lead,
        tutors: lead.tutors.filter(t => t.tutorId !== tutorId)
      };
    }));
  };

  // Update tutor amount
  const handleUpdateTutorAmount = (leadId: string, tutorId: string, newAmount: number) => {
    setAllocations(prev => prev.map(lead => {
      if (lead.id !== leadId) return lead;
      return {
        ...lead,
        tutors: lead.tutors.map(tutor => 
          tutor.tutorId === tutorId ? { ...tutor, amount: newAmount } : tutor
        )
      };
    }));
  };

  // In NewPaymentModal.tsx - Complete handleSubmit function with proper type
// In NewPaymentModal.tsx - Update the handleSubmit function

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (allocations.length === 0) {
    toast.error('Please add at least one student');
    return;
  }
  
  const hasTutors = allocations.some(lead => lead.tutors.length > 0);
  if (!hasTutors) {
    toast.error('Please add at least one tutor for each student');
    return;
  }
  
  if (!dueDate) {
    toast.error('Please select a due date');
    return;
  }
  
  setLoading(true);
  
  try {
    // Create payment records for each lead's tutors
    for (const lead of allocations) {
      for (const tutor of lead.tutors) {
        const paymentData = {
          tutorId: tutor.tutorId,
          tutorName: tutor.tutorName,
          tutorPhone: tutor.tutorPhone || '',
          amount: tutor.amount,
          dueDate,
          status: 'pending' as const,
          type: 'revenue' as const, // CHANGE THIS: 'revenue' instead of 'payout'
          mode,
          transactionId: transactionId || null,
          notes: notes || `Tution payment for ${lead.leadName} - ${tutor.tutorName} - ₹${tutor.amount}`,
          invoiceNumber: generateInvoiceNumber(),
          createdAt: new Date().toISOString(),
          leadId: lead.leadId,
          studentName: lead.leadName,
        };
        await addPayment(paymentData);
      }
    }
    
    const tutorCount = allocations.reduce((sum, lead) => sum + lead.tutors.length, 0);
    toast.success(`Payment created for ${allocations.length} student(s) and ${tutorCount} tutor(s). Total: ₹${totalAmount.toLocaleString('en-IN')}`);
    onClose();
  } catch (error) {
    console.error('Error creating payment:', error);
    toast.error('Failed to create payment');
  } finally {
    setLoading(false);
  }
};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen size={20} />
            Create Tution Payment
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Select students and assign tutors with amounts
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          
          {/* Lead Selection Section */}
          <div className="space-y-3 border border-border rounded-lg p-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <User size={16} />
              Select Student <span className="text-destructive">*</span>
            </Label>
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search student by name, ID, or phone..."
                  value={leadSearchTerm}
                  onChange={(e) => setLeadSearchTerm(e.target.value)}
                  onFocus={() => setShowLeadDropdown(true)}
                  className="pl-7 text-sm"
                />
                
                {/* Lead Search Results Dropdown */}
                {showLeadDropdown && (leadSearchTerm || filteredLeads.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg max-h-64 overflow-y-auto z-10 shadow-lg">
                    {leadsLoading ? (
                      <div className="p-3 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Loading students...
                      </div>
                    ) : filteredLeads.length === 0 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        No students found
                      </div>
                    ) : (
                      filteredLeads.map(lead => (
                        <button
                          key={lead.id}
                          type="button"
                          onClick={() => handleSelectLead(lead)}
                          className="w-full text-left p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-primary" />
                            <span className="font-medium text-sm">{lead.studentName}</span>
                            <span className="text-xs text-muted-foreground">{lead.leadId}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                            <span>📞 {lead.phone}</span>
                            <span>📚 Class {lead.class}</span>
                            {lead.parentName && <span>👨‍👩‍👦 {lead.parentName}</span>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <Button
                type="button"
                size="sm"
                onClick={handleAddLead}
                disabled={!selectedLead}
                className="shrink-0"
              >
                <Plus size={14} /> Add Student
              </Button>
            </div>
            
            {/* Selected Lead Preview */}
            {selectedLead && !showLeadDropdown && leadSearchTerm && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Selected:</span> {selectedLead.studentName} ({selectedLead.leadId})
                    <span className="ml-2 text-xs text-muted-foreground">
                      Class {selectedLead.class} | 📞 {selectedLead.phone}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLead(null);
                      setLeadSearchTerm('');
                    }}
                    className="text-red-500 text-xs"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Leads and Tutors List */}
          {allocations.length > 0 && (
            <div className="space-y-4">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Users size={14} />
                Students with Tutors ({allocations.length})
              </div>
              
              {allocations.map((lead) => (
                <div key={lead.id} className="border border-border rounded-lg p-3 bg-muted/5">
                  {/* Lead Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-primary" />
                        <span className="font-medium">{lead.leadName}</span>
                        <span className="text-xs text-muted-foreground">{lead.leadId}</span>
                        {lead.leadClass && (
                          <span className="text-xs bg-primary/10 px-2 py-0.5 rounded">
                            Class {lead.leadClass}
                          </span>
                        )}
                      </div>
                      {lead.leadPhone && (
                        <span className="text-xs text-muted-foreground">📞 {lead.leadPhone}</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLead(lead.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  
                  {/* Tutor Selection for this Lead */}
                  <div className="space-y-2 ml-4">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap size={14} className="text-muted-foreground" />
                      <Label className="text-xs font-medium">Add Tutors</Label>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search tutor by name, ID, or subject..."
                          value={tutorSearchTerms[lead.id] || ''}
                          onChange={(e) => {
                            setTutorSearchTerms(prev => ({ ...prev, [lead.id]: e.target.value }));
                            setShowTutorDropdowns(prev => ({ ...prev, [lead.id]: true }));
                            setSelectedTutors(prev => ({ ...prev, [lead.id]: null }));
                          }}
                          onFocus={() => setShowTutorDropdowns(prev => ({ ...prev, [lead.id]: true }))}
                          className="pl-7 text-sm"
                        />
                        
                        {/* Tutor Search Results for this Lead */}
                        {showTutorDropdowns[lead.id] && (tutorSearchTerms[lead.id] || getFilteredTutors(lead.id).length > 0) && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg max-h-48 overflow-y-auto z-10 shadow-lg">
                            {tutorsLoading ? (
                              <div className="p-2 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Loader2 size={14} className="animate-spin" />
                                Loading tutors...
                              </div>
                            ) : getFilteredTutors(lead.id).length === 0 ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                No tutors found
                              </div>
                            ) : (
                              getFilteredTutors(lead.id).map(tutor => (
                                <button
                                  key={tutor.id}
                                  type="button"
                                  onClick={() => handleSelectTutor(lead.id, tutor)}
                                  className="w-full text-left p-2 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                                  disabled={isTutorAdded(lead.id, tutor.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <GraduationCap size={12} className="text-primary" />
                                    <span className="font-medium text-sm">{tutor.name}</span>
                                    <span className="text-xs text-muted-foreground">{tutor.tutorId}</span>
                                    {isTutorAdded(lead.id, tutor.id) && (
                                      <span className="text-xs text-green-600">✓ Added</span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-muted-foreground">
                                    <span>📞 {tutor.phone}</span>
                                    <span>⭐ {tutor.teachingExperience || '0'} yrs</span>
                                  </div>
                                  {tutor.subjectsHandled && tutor.subjectsHandled.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {tutor.subjectsHandled.slice(0, 2).map(s => (
                                        <span key={s} className="text-xs bg-primary/10 px-1.5 py-0.5 rounded">
                                          {s}
                                        </span>
                                      ))}
                                      {tutor.subjectsHandled.length > 2 && (
                                        <span className="text-xs text-muted-foreground">+{tutor.subjectsHandled.length - 2}</span>
                                      )}
                                    </div>
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Input
                        type="number"
                        placeholder="Amount ₹"
                        value={tutorAmounts[lead.id] || ''}
                        onChange={(e) => setTutorAmounts(prev => ({ ...prev, [lead.id]: e.target.value }))}
                        className="w-28 text-sm"
                      />
                      
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddTutor(lead.id)}
                        disabled={!selectedTutors[lead.id] || !tutorAmounts[lead.id]}
                        className="shrink-0"
                      >
                        <Plus size={14} /> Add
                      </Button>
                    </div>
                    
                    {/* Tutors List for this Lead */}
                    {lead.tutors.length > 0 ? (
                      <div className="space-y-1.5 mt-3">
                        {lead.tutors.map((tutor) => (
                          <div key={tutor.tutorId} className="flex items-center justify-between bg-white/50 p-2 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <GraduationCap size={12} className="text-primary" />
                                <span className="text-sm font-medium">{tutor.tutorName}</span>
                                <span className="text-xs text-muted-foreground">{tutor.tutorId}</span>
                                {tutor.subjects && tutor.subjects.length > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    ({tutor.subjects.slice(0, 2).join(', ')})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={tutor.amount}
                                onChange={(e) => handleUpdateTutorAmount(lead.id, tutor.tutorId, parseFloat(e.target.value) || 0)}
                                className="w-24 h-8 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveTutor(lead.id, tutor.tutorId)}
                                className="p-1 text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Lead Subtotal */}
                        <div className="flex justify-end items-center pt-1 border-t border-border mt-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Subtotal: ₹{lead.tutors.reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs text-muted-foreground border border-dashed rounded-lg">
                        No tutors added yet
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Grand Total */}
              <div className="flex justify-between items-center pt-3 border-t-2 border-primary/20">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Calculator size={16} />
                  Grand Total:
                </span>
                <span className="text-xl font-bold text-primary">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
          
          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          {/* Payment Mode */}
          <div className="space-y-2">
            <Label>Payment Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Transaction ID */}
          {mode !== 'cash' && (
            <div className="space-y-2">
              <Label>Transaction ID</Label>
              <Input
                placeholder="Enter transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>
          )}
          
          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || allocations.length === 0 || totalAmount === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create Payment (₹${totalAmount.toLocaleString('en-IN')})`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}