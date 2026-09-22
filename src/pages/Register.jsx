import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

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
  const [accountType, setAccountType] = useState(initialAccountType);

  useEffect(() => {
    localStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify({
      email,
      accountType,
      legalAgreed,
      step: showOtp ? 'otp' : 'details',
    }));
  }, [email, accountType, legalAgreed, showOtp]);

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
    if (!legalAgreed) {
      setError("Please accept Stelli's Terms and Privacy Policy to continue.");
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
      await base44.auth.updateMe({ account_type: accountType });
      try {
        await Promise.all([
          base44.functions.invoke('recordAgreementAcceptance', { documentType: 'terms', documentVersion: '2026-09-10' }),
          base44.functions.invoke('recordAgreementAcceptance', { documentType: 'privacy', documentVersion: '2026-09-10' }),
        ]);
      } catch {
        localStorage.setItem('stelli_pending_legal_acceptance', 'true');
      }
      localStorage.removeItem(REGISTER_DRAFT_KEY);
      window.location.href = "/portal";
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
    if (!legalAgreed) {
      setError("Please accept Stelli's Terms and Privacy Policy to continue.");
      return;
    }
    localStorage.setItem('stelli_pending_account_type', accountType);
    localStorage.setItem('stelli_pending_legal_acceptance', 'true');
    base44.auth.loginWithProvider("google", "/portal");
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verify your email"
        subtitle={`We sent a code to ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
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
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
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
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { id: 'client', label: 'Client' },
          { id: 'creator', label: 'Creator' },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setAccountType(option.id)}
            className={`h-11 rounded-md border text-xs font-semibold transition-colors ${accountType === option.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
        disabled={!legalAgreed || !accountType}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer">
          <Checkbox checked={legalAgreed} onCheckedChange={setLegalAgreed} className="mt-0.5" />
          <span className="text-xs leading-relaxed text-muted-foreground">
            I agree to Stelli's <Link to="/terms" className="text-primary underline">Terms and Conditions</Link> and <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
          </span>
        </label>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading || !legalAgreed || !accountType}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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