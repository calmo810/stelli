import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authFieldIcon, authHint, authInputWithIcon, authLabel, authLink, authNotice, authPrimary, authSecondary, otpGroup, otpSlot } from "@/lib/authStyles";
import AuthLayout from "@/components/AuthLayout";
import StelliCheck from "@/components/shared/StelliCheck";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legalDocuments";
import { safeReturnTo } from "@/lib/authReturnTo";

// Honor ?returnTo= (used by the MCP consent flow), else the app's portal.
const afterAuth = () =>
  new URLSearchParams(window.location.search).get("returnTo") ? safeReturnTo() : "/portal";

const REGISTER_DRAFT_KEY = 'stelli_register_draft';
const VALID_ACCOUNT_TYPES = ['client', 'creator'];

function getRegisterDraft() {
  try {
    return JSON.parse(localStorage.getItem(REGISTER_DRAFT_KEY) || '{}');
  } catch {
    return {};
  }
}

function initialAccountType() {
  const requested = new URLSearchParams(window.location.search).get('role');
  if (VALID_ACCOUNT_TYPES.includes(requested)) return requested;
  const draft = getRegisterDraft();
  return VALID_ACCOUNT_TYPES.includes(draft.accountType) ? draft.accountType : '';
}

export default function Register() {
  const draft = getRegisterDraft();
  const [email, setEmail] = useState(draft.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(draft.step === 'otp');
  const [otpCode, setOtpCode] = useState("");
  const [legalAgreed, setLegalAgreed] = useState(Boolean(draft.legalAgreed));
  const [adult, setAdult] = useState(Boolean(draft.adult));
  const [accountType, setAccountType] = useState(initialAccountType);

  useEffect(() => {
    let active = true;
    base44.auth.isAuthenticated()
      .then((ok) => {
        if (active && ok) window.location.replace(afterAuth());
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify({
      email,
      accountType,
      legalAgreed,
      adult,
      step: showOtp ? 'otp' : 'details',
    }));
  }, [email, accountType, legalAgreed, adult, showOtp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!accountType) {
      setError("Choose whether this is a client or creator account.");
      return;
    }
    if (!adult) {
      setError("Stelli is for adults. Confirm you're 18 or older to continue.");
      return;
    }
    if (!legalAgreed) {
      setError("Please accept Stelli's Terms and Conditions to continue.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      await base44.auth.updateMe({ account_type: accountType, age_confirmed: true });
      localStorage.setItem('stelli_next_step_prompt', accountType);
      try {
        await Promise.all([
          base44.functions.invoke('recordAgreementAcceptance', { documentType: 'terms', documentVersion: TERMS_VERSION }),
          base44.functions.invoke('recordAgreementAcceptance', { documentType: 'privacy', documentVersion: PRIVACY_VERSION }),
        ]);
      } catch {
        localStorage.setItem('stelli_pending_legal_acceptance', 'true');
      }
      localStorage.removeItem(REGISTER_DRAFT_KEY);
      window.location.href = afterAuth();
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: "Code sent",
        description: "Check your email for the new code.",
      });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => {
    if (!accountType) {
      setError("Choose whether this is a client or creator account.");
      return;
    }
    if (!adult) {
      setError("Stelli is for adults. Confirm you're 18 or older to continue.");
      return;
    }
    if (!legalAgreed) {
      setError("Please accept Stelli's Terms and Conditions to continue.");
      return;
    }
    localStorage.setItem('stelli_pending_account_type', accountType);
    localStorage.setItem('stelli_next_step_prompt', accountType);
    localStorage.setItem('stelli_pending_legal_acceptance', 'true');
    // Applied on the account by /portal once Google sends them back.
    localStorage.setItem('stelli_pending_age_confirmed', 'true');
    base44.auth.loginWithProvider("google", afterAuth());
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verify your email"
        subtitle={`We sent a code to ${email}`}
      >
        {error && (
          <div role="alert" className={`${authNotice} mb-4`}>
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup className={otpGroup}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot key={index} index={index} className={otpSlot} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className={authPrimary}
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
        <p className={`mt-4 text-center ${authHint}`}>
          Didn't receive the code?{" "}
          <button type="button" onClick={handleResend} className={authLink}>
            Resend
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Pick a role once, then Stelli routes you to the right portal"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className={authLink}>
            Log in
          </Link>
        </>
      }
    >
      {/* Client or creator: the home page's two doors, as one switch. */}
      <div role="radiogroup" aria-label="Account type" className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-white/[0.12] bg-white/[0.05] p-1">
        {[
          { id: 'client', label: 'Client', accent: 'var(--neon-lime)' },
          { id: 'creator', label: 'Creator', accent: 'var(--neon-cyan)' },
        ].map((option) => {
          const active = accountType === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setAccountType(option.id)}
              className={`h-11 rounded-full text-[14px] font-semibold transition-colors ${active ? 'text-ink' : 'text-white/60 hover:text-white'}`}
              style={active ? { background: `hsl(${option.accent})`, boxShadow: `0 8px 22px -12px hsl(${option.accent} / 0.85)` } : undefined}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <Button
        variant="outline"
        className={`${authSecondary} mb-5`}
        onClick={handleGoogle}
        disabled={!legalAgreed || !adult || !accountType}
      >
        <GoogleIcon className="w-5 h-5" />
        Continue with Google
      </Button>

      <div className="mb-5 flex items-center gap-3 text-[13px] text-white/35">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {error && (
        <div role="alert" className={`${authNotice} mb-4`}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className={authLabel}>Email</Label>
          <div className="relative">
            <Mail className={authFieldIcon} aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputWithIcon}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className={authLabel}>Password</Label>
          <div className="relative">
            <Lock className={authFieldIcon} aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputWithIcon}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm" className={authLabel}>Confirm password</Label>
          <div className="relative">
            <Lock className={authFieldIcon} aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={authInputWithIcon}
              required
            />
          </div>
        </div>
        <div className="space-y-3 pt-1">
          <StelliCheck checked={adult} onChange={setAdult}>I'm 18 or older.</StelliCheck>
          <StelliCheck checked={legalAgreed} onChange={setLegalAgreed}>
            I agree to Stelli's{" "}
            <Link to="/terms" className="text-white underline underline-offset-2 hover:text-neon-lime">Terms and Conditions</Link>.
          </StelliCheck>
        </div>
        <Button type="submit" className={authPrimary} disabled={loading || !legalAgreed || !adult || !accountType}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}