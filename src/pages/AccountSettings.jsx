import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LoginEmailBox from '@/components/account/LoginEmailBox';
import PasswordBox from '@/components/account/PasswordBox';
import { isGoogleUser } from '@/lib/authProvider';

export default function AccountSettings() {
  const { data: user, isLoading } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: lensman } = useQuery({
    queryKey: ['my-lensman-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ user_id: user.id });
      return list[0] || null;
    },
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/15 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const backTo = lensman ? '/lensman-dashboard' : '/client-dashboard';
  const googleUser = isGoogleUser(user);

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-2xl mx-auto px-5 md:px-10 py-16">
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 label-mono text-[10px] text-white/40 hover:text-neon-cyan transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard.
        </Link>

        <h1 className="font-heading text-white font-semibold leading-[0.95] mt-8 mb-10" style={{ fontSize: 'clamp(32px, 4.5vw, 52px)' }}>
          Account settings
        </h1>

        <div className="space-y-5">
          <LoginEmailBox email={user.email} googleUser={googleUser} />
          <PasswordBox user={user} googleUser={googleUser} />
        </div>
      </div>
    </div>
  );
}