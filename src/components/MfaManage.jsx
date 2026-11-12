import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Smartphone, MessageSquare } from "lucide-react";
import MfaMethodSetup from "@/components/MfaMethodSetup";
import { CodeField, MfaHeader, MfaNotice, ResendLine, useCooldown } from "@/components/MfaParts";
import { authPrimary, authSecondary } from "@/lib/authStyles";

const METHODS = [
  { id: "totp", name: "Authenticator app", icon: Smartphone,
    description: "Use an app like Google Authenticator or Duo to generate secure sign-in codes." },
  { id: "sms", name: "Text messages", icon: MessageSquare, description: "Get sign-in codes sent to your phone by text message." },
];
const SMS_RESEND_SECONDS = 30;

// Two-factor authentication settings: enable, replace or disable a method. Card content, shown
// with <MfaScreen>. session is the mfaSession that just verified a management sign-in; its grant
// lasts a few minutes, so an expired one sends the user back through /mfa.
// The helper also offers session.forgetDevices(code, method) for a "forget remembered devices" control.
export default function MfaManage({ session, returnTo }) {
  const [status, setStatus] = useState(null);
  const [view, setView] = useState({ name: "list" });
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      setStatus(await session.status());
    } catch (err) {
      setError(err);
    }
  };
  useEffect(() => { load(); }, [session]);

  const back = () => { setView({ name: "list" }); load(); };

  return (
    <div className="session-record-block">
      <MfaHeader title="Two-factor authentication"
        description="Add an extra layer of protection when signing in. You'll be asked for a code each time you sign in." />
      {view.name === "setup" && <MfaMethodSetup session={session} method={view.method} signInPath="/mfa" onDone={back} onBack={() => setView({ name: "list" })} />}
      {view.name === "disable" && <Disable session={session} method={view.method} onDone={back} onBack={() => setView({ name: "list" })} />}
      {view.name === "list" && (
        <div className="space-y-4">
          <MfaNotice error={error} signInPath="/mfa" />
          {!status && !error && <Loader2 className="mx-auto h-6 w-6 animate-spin text-white/50" />}
          {status && METHODS.map(({ id, name, icon: Icon, description }) => {
            const enrolled = status.methods.includes(id);
            return (
              <div key={id} className="flex flex-wrap items-center gap-3.5 rounded-[20px] border border-white/[0.1] bg-white/[0.04] p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[0.08] text-white/75">
                  <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div className="flex-1 min-w-[10rem]">
                  <p className="text-[15px] font-semibold text-white">{name}</p>
                  <p className={`mt-0.5 text-[13px] leading-snug ${enrolled ? "text-neon-lime" : "text-white/55"}`}>
                    {enrolled ? (id === "sms" && status.phone_hint ? `Enabled · ${status.phone_hint}` : "Enabled") : description}
                  </p>
                </div>
                {/* On a narrow screen the actions drop below the method instead of squeezing it. */}
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" variant="outline" className="h-9 rounded-full border-white/[0.14] bg-white/[0.06] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-white/[0.12] hover:text-white" onClick={() => setView({ name: "setup", method: id })}>
                    {enrolled ? "Replace" : "Enable"}
                  </Button>
                  {enrolled && (
                    <Button size="sm" variant="ghost" className="h-9 rounded-full px-4 text-[13px] font-semibold text-white/60 hover:bg-white/[0.08] hover:text-white" onClick={() => setView({ name: "disable", method: id })}>
                      Disable
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          <Button className={authPrimary} onClick={() => { window.location.href = returnTo; }}>
            Done
          </Button>
        </div>
      )}
    </div>
  );
}

// Disables a method after a fresh code from that same method.
function Disable({ session, method, onDone, onBack }) {
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(method === "totp");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useCooldown();

  const run = async (task) => {
    setError(null);
    setBusy(true);
    try {
      return await task();
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    if (await run(() => session.sendProofCode())) {
      setCodeSent(true);
      setCooldown(SMS_RESEND_SECONDS);
    }
  };

  const confirm = async (value = code) => {
    if (busy || value.length < 6) return;
    if (await run(() => session.removeMethod(method, value, method))) onDone();
    else setCode("");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-center font-display text-[22px] font-medium leading-tight text-white">
        {method === "totp" ? "Enter a code from your authenticator app" : "Verify with a code sent to your phone"}
      </h2>
      <MfaNotice error={error} signInPath="/mfa" />
      {codeSent ? (
        <>
          <CodeField id="mfa-disable-code" value={code} onChange={setCode} onComplete={confirm} />
          {method === "sms" && <ResendLine cooldown={cooldown} disabled={busy} onResend={sendCode} />}
        </>
      ) : (
        <Button className={authPrimary} disabled={busy} onClick={sendCode}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Send code
        </Button>
      )}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button variant="outline" className={authSecondary} disabled={busy} onClick={onBack}>Cancel</Button>
        <Button className={authPrimary} disabled={busy || !codeSent || code.length < 6} onClick={() => confirm()}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Turn off
        </Button>
      </div>
    </div>
  );
}
