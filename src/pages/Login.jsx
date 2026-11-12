import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import { authFieldIcon, authInputWithIcon, authLabel, authLink, authNotice, authPrimary, authSecondary } from "@/lib/authStyles";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";
import { loginWithMfa } from "@/lib/authMfa";
import { signInWithProvider } from "@/lib/authMfaFlow";
import MfaFlow from "@/components/MfaFlow";
import { MfaScreen } from "@/components/MfaParts";

// Honor ?returnTo= (used by the MCP consent flow), else the app's portal.
const afterAuth = () =>
  new URLSearchParams(window.location.search).get("returnTo") ? safeReturnTo() : "/portal";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    base44.auth.isAuthenticated()
      .then((ok) => {
        if (active && ok) window.location.replace(afterAuth());
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Set when the password was right but the account needs a second step.
  const [challenge, setChallenge] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // The plain SDK call drops the "second step needed" answer and leaves the
      // visitor signed out with no explanation. This one keeps it.
      const result = await loginWithMfa(email, password);
      if (result?.access_token) {
        window.location.href = afterAuth();
      } else if (result?.mfa_session_token) {
        setChallenge(result);
      } else {
        setError("We couldn't sign you in. Try again.");
      }
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    // Goes through /mfa when the app requires a second step; otherwise this is
    // the same Google sign-in as before.
    signInWithProvider("google", afterAuth()).catch(() =>
      base44.auth.loginWithProvider("google", afterAuth())
    );
  };

  if (challenge) {
    return (
      <MfaScreen>
        <MfaFlow challenge={challenge} returnTo={afterAuth()} />
      </MfaScreen>
    );
  }

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className={authLink}>
            Create one
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className={`${authSecondary} mb-5`}
        onClick={handleGoogle}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className={authLabel}>Password</Label>
            <Link to="/forgot-password" className={`text-[12px] ${authLink}`}>
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className={authFieldIcon} aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputWithIcon}
              required
            />
          </div>
        </div>
        <Button type="submit" className={authPrimary} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}