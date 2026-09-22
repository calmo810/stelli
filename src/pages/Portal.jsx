import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function Portal() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let user = await base44.auth.me();
        const pendingRole = localStorage.getItem('stelli_pending_account_type');
        if (!user?.account_type && ['client', 'creator'].includes(pendingRole)) {
          user = await base44.auth.updateMe({ account_type: pendingRole });
          localStorage.removeItem('stelli_pending_account_type');
        }
        if (!active) return;
        if (user?.account_type === 'creator') navigate('/lensman-dashboard', { replace: true });
        else if (user?.account_type === 'client') navigate('/client-dashboard', { replace: true });
        else navigate('/onboarding', { replace: true });
      } catch {
        if (active) navigate('/onboarding', { replace: true });
      }
    })();
    return () => { active = false; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(var(--neon-lime))' }} />
    </div>
  );
}