import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import ConfirmAction from '@/components/shared/ConfirmAction';

/**
 * Put an approved creator on hold, or lift it. On hold: hidden from browse,
 * their page hidden, no new requests. Their current bookings carry on.
 * Runs on the server (reviewCreator), which checks the admin role and logs it.
 */
export default function CreatorHoldButton({ lensman }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const onHold = Boolean(lensman.under_review);
  const name = lensman.display_name || 'This creator';

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('reviewCreator', {
        lensmanId: lensman.id,
        decision: onHold ? 'unhold' : 'hold',
      });
      if (response.data?.error) throw new Error(response.data.error);
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['admin-lensmen'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'That did not save. Nothing was changed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[44px] border border-white/15 px-3 font-body text-[12px] font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        style={{ borderRadius: 4 }}
      >
        {onHold ? 'Lift hold' : 'Put on hold'}
      </button>
      <ConfirmAction
        open={open}
        title={onHold ? `Lift the hold on ${name}?` : `Put ${name} on hold?`}
        message={
          onHold
            ? `${name} goes back into browse and can get new requests.`
            : `${name} is hidden from browse, their page is hidden, and they can’t get new requests until you lift it. Their current bookings carry on.`
        }
        confirmLabel={onHold ? 'Lift hold' : 'Put on hold'}
        busy={busy}
        error={error}
        onConfirm={run}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
