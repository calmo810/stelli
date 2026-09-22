import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function UnsavedChangesDialog({ open, onKeepEditing, onLeave }) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onKeepEditing(); }}>
      <DialogContent className="max-w-md" style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.12)' }}>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-white">You have unsaved changes.</DialogTitle>
          <DialogDescription className="font-body text-[13px] text-white/50">
            Leave without saving?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <button
            onClick={onKeepEditing}
            className="flex-1 label-mono text-[10px] py-3 border transition-colors hover:border-white/40"
            style={{ borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.7)', borderRadius: 4 }}
          >
            Keep editing
          </button>
          <button
            onClick={onLeave}
            className="flex-1 label-mono text-[10px] font-semibold py-3"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
          >
            Leave
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}