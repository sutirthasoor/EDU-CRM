import { useState, useMemo } from 'react';
import { Search, Download, PlusCircle, Calendar, DollarSign, CreditCard, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import toast from 'react-hot-toast';

interface InvoiceGeneratorTabProps {
  leads: Lead[];
  onCreatePayment?: (paymentData: any) => Promise<void>;
}

export default function InvoiceGeneratorTab({ leads = [], onCreatePayment }: InvoiceGeneratorTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState({
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    type: 'monthly' as 'advance' | 'monthly',
    mode: 'cash' as 'cash' | 'upi' | 'card' | 'bank_transfer',
    transactionId: '',
    notes: '',
  });
  const [generating, setGenerating] = useState(false);

  const filteredLeads = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    if (!searchTerm.trim()) return leads;
    
    const term = searchTerm.toLowerCase().trim();
    return leads.filter(lead =>
      lead.studentName?.toLowerCase().includes(term) ||
      lead.leadId?.toLowerCase().includes(term) ||
      lead.phone?.includes(term)
    );
  }, [leads, searchTerm]);

  const handleOpenInvoiceModal = (lead: Lead) => {
    setSelectedLead(lead);
    setInvoiceDetails({
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      type: 'monthly',
      mode: 'cash',
      transactionId: '',
      notes: '',
    });
    setShowInvoiceModal(true);
  };

  const handleGenerateAndSave = async () => {
    if (!selectedLead) {
      toast.error('Please select a lead');
      return;
    }
    
    if (invoiceDetails.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setGenerating(true);
    
    try {
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const paymentData = {
        leadId: selectedLead.id,
        studentName: selectedLead.studentName,
        invoiceNumber: invoiceNumber,
        amount: invoiceDetails.amount,
        dueDate: invoiceDetails.dueDate,
        status: 'pending',
        type: invoiceDetails.type,
        mode: invoiceDetails.mode,
        transactionId: invoiceDetails.transactionId || null,
        notes: invoiceDetails.notes || null,
      };

      // Create payment record first
      if (onCreatePayment) {
        await onCreatePayment(paymentData);
        toast.success('Payment record created successfully');
      }

      // Generate PDF
      await generateInvoicePDF({
        invoiceNumber: invoiceNumber,
        studentName: selectedLead.studentName,
        amount: invoiceDetails.amount,
        date: new Date().toLocaleDateString('en-IN'),
        dueDate: invoiceDetails.dueDate ? new Date(invoiceDetails.dueDate).toLocaleDateString('en-IN') : '',
        status: 'pending',
        paymentMode: invoiceDetails.mode,
        transactionId: invoiceDetails.transactionId,
        notes: invoiceDetails.notes,
      });
      
      toast.success('Invoice downloaded successfully');
      setShowInvoiceModal(false);
      setSelectedLead(null);
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateOnly = async () => {
    if (!selectedLead) {
      toast.error('Please select a lead');
      return;
    }
    
    if (invoiceDetails.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setGenerating(true);
    
    try {
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      await generateInvoicePDF({
        invoiceNumber: invoiceNumber,
        studentName: selectedLead.studentName,
        amount: invoiceDetails.amount,
        date: new Date().toLocaleDateString('en-IN'),
        dueDate: invoiceDetails.dueDate ? new Date(invoiceDetails.dueDate).toLocaleDateString('en-IN') : '',
        status: 'pending',
        paymentMode: invoiceDetails.mode,
        transactionId: invoiceDetails.transactionId,
        notes: invoiceDetails.notes,
      });
      
      toast.success('Invoice downloaded successfully');
      setShowInvoiceModal(false);
      setSelectedLead(null);
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const totalLeads = leads?.length || 0;
  const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;

  if (!leads || leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText size={48} className="text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">No leads available</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Add leads first to generate invoices</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
          <div className="flex items-center gap-2 text-primary mb-1">
            <FileText size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Total Leads</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalLeads}</p>
          <p className="text-xs text-muted-foreground">Available for invoicing</p>
        </div>
        <div className="bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Converted</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{convertedLeads}</p>
          <p className="text-xs text-muted-foreground">Ready for billing</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search lead by name, ID, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Leads Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lead ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-border">
  {filteredLeads.length === 0 ? (
    <tr>
      <td colSpan={6} className="text-center py-12 text-muted-foreground">
        <Search size={32} className="mx-auto mb-2 text-muted-foreground/30" />
        {searchTerm ? 'No leads match your search' : 'No leads found'}
      </td>
    </tr>
  ) : (
    filteredLeads.map((lead) => (
      <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3 font-mono text-xs font-medium text-primary">{lead.leadId}</td>
        <td className="px-4 py-3">
          <p className="font-medium text-foreground">{lead.studentName}</p>
          {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
        </td>
        <td className="px-4 py-3 text-sm">{lead.phone}</td>
        <td className="px-4 py-3 text-sm">{lead.class}</td>
        <td className="px-4 py-3">
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            lead.status === 'converted' ? 'bg-emerald-100 text-emerald-700' :
            lead.status === 'lost' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          )}>
            {lead.status?.replace(/_/g, ' ') || 'New'}
          </span>
        </td>
        <td className="px-4 py-3">
          <Button
            size="sm"
            onClick={() => handleOpenInvoiceModal(lead)}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
          >
            <Download size={14} />
            Generate Invoice
          </Button>
        </td>
      </tr>
    ))
  )}
</tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              Generate Invoice
            </DialogTitle>
            {selectedLead && (
              <p className="text-sm text-muted-foreground mt-1">
                For: <span className="font-semibold text-foreground">{selectedLead.studentName}</span> 
                <span className="mx-1">•</span>
                <span className="font-mono text-xs">{selectedLead.leadId}</span>
              </p>
            )}
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Amount Section */}
            <div className="bg-primary/5 rounded-lg p-4">
              <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-primary" />
                Invoice Amount *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                <Input
                  type="number"
                  value={invoiceDetails.amount}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="pl-7 text-lg font-semibold"
                />
              </div>
            </div>

            {/* Due Date Section */}
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-primary" />
                Due Date *
              </Label>
              <Input
                type="date"
                value={invoiceDetails.dueDate}
                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, dueDate: e.target.value })}
                className="w-full"
              />
            </div>

            {/* Payment Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <CreditCard size={16} className="text-primary" />
                  Payment Type
                </Label>
                <Select value={invoiceDetails.type} onValueChange={(v: any) => setInvoiceDetails({ ...invoiceDetails, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">📅 Monthly Fee</SelectItem>
                    <SelectItem value="advance">💰 Advance Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <CreditCard size={16} className="text-primary" />
                  Payment Mode
                </Label>
                <Select value={invoiceDetails.mode} onValueChange={(v: any) => setInvoiceDetails({ ...invoiceDetails, mode: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Cash</SelectItem>
                    <SelectItem value="upi">📱 UPI</SelectItem>
                    <SelectItem value="card">💳 Card</SelectItem>
                    <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Transaction ID */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Transaction ID (Optional)</Label>
              <Input
                value={invoiceDetails.transactionId}
                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, transactionId: e.target.value })}
                placeholder="Enter transaction ID / Reference number"
              />
            </div>

            {/* Notes */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Notes (Optional)</Label>
              <Textarea
                value={invoiceDetails.notes}
                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, notes: e.target.value })}
                placeholder="Additional notes, remarks, or special instructions..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  This will generate an invoice PDF and create a pending payment record. 
                  You can mark it as paid from the Payments tab.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleGenerateOnly} disabled={generating} className="gap-2">
              <Download size={14} />
              {generating ? 'Generating...' : 'Download Only'}
            </Button>
            <Button onClick={handleGenerateAndSave} disabled={generating} className="gap-2">
              <PlusCircle size={14} />
              {generating ? 'Processing...' : 'Save & Download'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}