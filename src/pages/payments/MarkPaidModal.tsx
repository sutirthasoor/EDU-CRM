import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { updatePayment } from '../../hooks/usePayments';
import type { Payment } from '../../types';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
  onSuccess?: () => void;
}

export default function MarkPaidModal({ open, onClose, payment, onSuccess }: Props) {
  const [mode, setMode] = useState('upi');
  const [transactionId, setTransactionId] = useState('');
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!payment) return;
    setSaving(true);
    try {
      await updatePayment(payment.id, {
        status: 'paid',
        mode: mode as Payment['mode'],
        ...(transactionId && { transactionId }),
        paidDate,
      });
      toast.success('Payment marked as paid');
      
      // Call onSuccess to refresh data
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to mark payment as paid');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark as Paid</DialogTitle>
          {payment && <p className="text-xs text-muted-foreground">{payment.studentName} · {payment.invoiceNumber}</p>}
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Payment Mode *</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/60">
              {['upi', 'card', 'netbanking', 'wallet', 'cash'].map((m) => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Transaction ID</label>
            <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="UPI ref / bank ref"
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Paid Date *</label>
            <input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/60" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !paidDate}>
            {saving ? 'Saving...' : 'Confirm Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}