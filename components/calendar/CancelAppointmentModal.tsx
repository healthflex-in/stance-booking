import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui-atoms/Button';
import { Card, CardContent, CardHeader } from '@/components/ui-atoms/Card';
import { Select } from '@/components/ui-atoms/Select';
import { CancellationReason } from '@/gql/hooks';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cancellationReason: CancellationReason, cancellationNote: string) => void;
  isLoading?: boolean;
  isRescheduling?: boolean;
}

export default function CancelAppointmentModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  isRescheduling = false,
}: CancelAppointmentModalProps) {
  const [cancellationReason, setCancellationReason] = useState<CancellationReason | ''>('');
  const [cancellationNote, setCancellationNote] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!cancellationReason) {
      setError('Please select a reason for cancellation');
      return;
    }
    onConfirm(cancellationReason, cancellationNote);
  };

  const handleClose = () => {
    setCancellationReason('');
    setCancellationNote('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[40] flex items-center justify-center bg-black/60"
      onClick={handleClose}
    >
      <Card
        className="bg-white w-full max-w-md rounded-lg shadow-xl relative z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cancel Appointment</h2>
            <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Select
            label="Reason for Cancellation *"
            value={cancellationReason}
            onChange={(e) => {
              const value = typeof e === 'string' ? e : e.target.value;
              setCancellationReason(value as CancellationReason);
              setError('');
            }}
            disabled={isLoading}
            error={error}
            placeholder="Select a reason"
            options={[
              { value: CancellationReason.PatientRequest, label: 'Patient Request' },
              { value: CancellationReason.PatientNoShow, label: 'Patient No Show' },
              { value: CancellationReason.PatientIllness, label: 'Patient Illness' },
              { value: CancellationReason.ConsultantUnavailable, label: 'Consultant Unavailable' },
              { value: CancellationReason.TreatmentNotNeeded, label: 'Treatment Not Needed' },
              { value: CancellationReason.ReferredElsewhere, label: 'Referred Elsewhere' },
              ...(isRescheduling ? [{ value: CancellationReason.Rescheduled, label: 'Rescheduled' }] : []),
            ]}
          />

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 p-2 min-h-[200px]"
              value={cancellationNote}
              onChange={(e) => setCancellationNote(e.target.value)}
              placeholder="Enter any additional notes..."
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
