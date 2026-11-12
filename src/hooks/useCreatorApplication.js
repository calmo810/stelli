import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  APPLICATION_SECTIONS, FIELD_SECTION, SECTIONS,
  applicationPayload, applicationProblem, formFromDraft, hasContent, readFailure,
} from '@/lib/creatorProfile';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legalDocuments';
import { applyPendingSignupChoices } from '@/lib/signupChoices';
import useMyCreatorProfile, { MY_CREATOR_PROFILE_KEY } from '@/hooks/useMyCreatorProfile';
import useProfileForm from '@/hooks/useProfileForm';

const LEGACY_DRAFT_KEY = 'stelli_profile_draft_v2';
const draftKey = (userId) => `stelli_profile_draft_v3:${userId}`;
const NEXT_STEP_PROMPT_KEY = 'stelli_next_step_prompt';

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}
function writeJson(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* a full or blocked store never blocks the application */
  }
}
function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* nothing to clear */
  }
}

/**
 * The newest saved application for this person: the one on their account
 * (which follows them to any device) or the one in this browser.
 */
function newestDraft(user) {
  const onAccount = user?.creator_draft && typeof user.creator_draft === 'object' && Object.keys(user.creator_draft).length
    ? user.creator_draft
    : null;
  const onDevice = readJson(draftKey(user.id)) || readJson(LEGACY_DRAFT_KEY);
  if (onAccount && onDevice) {
    return String(onAccount._savedAt || '') > String(onDevice._savedAt || '') ? onAccount : onDevice;
  }
  return onAccount || onDevice;
}

/**
 * The creator application: four sections of the profile form in a row, a draft
 * that follows the applicant between devices, and one send.
 *
 * `status` is 'loading', 'has-profile' (already applied: the portal is where
 * they belong), 'applying' or 'sent'.
 */
export default function useCreatorApplication() {
  const queryClient = useQueryClient();
  const { form, set, replace, uploads } = useProfileForm();
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('loading');
  const [problem, setProblem] = useState('');
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);

  const loaded = useRef(false);
  // Set the moment the application goes in, so a draft save already on its way
  // can't write the draft back over "submitted".
  const sent = useRef(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
    retry: false,
  });
  const userId = user?.id;
  const { data: own, isFetched: ownFetched, isError: ownFailed, refetch: retryOwn } = useMyCreatorProfile(userId);

  // An application belongs to an account. Someone new who taps "Apply" goes
  // to creator signup and comes straight back here.
  useEffect(() => {
    if (userLoading || user) return;
    window.location.replace(`/register?role=creator&returnTo=${encodeURIComponent('/apply')}`);
  }, [userLoading, user]);

  // Arriving here straight from signup skips the portal, so this page finishes
  // what the portal would have: the account type chosen before a Google
  // sign-in, and no "ready to apply?" prompt waiting for later.
  useEffect(() => {
    if (!user || loaded.current) return;
    (async () => {
      const current = await applyPendingSignupChoices(user);
      if (!current?.account_type) await base44.auth.updateMe({ account_type: 'creator' }).catch(() => {});
      try {
        if (localStorage.getItem(NEXT_STEP_PROMPT_KEY) === 'creator') localStorage.removeItem(NEXT_STEP_PROMPT_KEY);
      } catch {
        /* nothing to clear */
      }
    })();
  }, [user]);

  // Once we know who this is and whether they already have a profile, open
  // the form: their draft at the screen they left, or a fresh one.
  useEffect(() => {
    if (loaded.current || !user || !ownFetched || ownFailed) return;
    loaded.current = true;
    if (own?.lensman) {
      setStatus('has-profile');
      return;
    }
    const draft = newestDraft(user);
    replace(formFromDraft(draft || {}, user));
    const resumeAt = APPLICATION_SECTIONS.indexOf(draft?._step);
    if (resumeAt > 0) setStep(resumeAt);
    setStatus('applying');
  }, [user, own, ownFetched, ownFailed, replace]);

  const sectionKey = APPLICATION_SECTIONS[step];

  // The draft is saved twice: in this browser right away, and on the account
  // a moment later (start on a phone, finish on the laptop with the photos).
  useEffect(() => {
    if (status !== 'applying' || !userId) return undefined;
    setSaved(false);
    const draft = { ...form, _savedAt: new Date().toISOString(), _step: sectionKey };
    const local = setTimeout(() => {
      if (sent.current) return;
      writeJson(draftKey(userId), draft);
      removeKey(LEGACY_DRAFT_KEY);
      setSaved(true);
    }, 500);
    const remote = setTimeout(() => {
      if (sent.current || !hasContent(form)) return;
      base44.auth
        .updateMe({ creator_draft: draft, creator_draft_step: sectionKey, creator_draft_at: draft._savedAt })
        .catch(() => {});
    }, 2500);
    return () => {
      clearTimeout(local);
      clearTimeout(remote);
    };
  }, [form, sectionKey, status, userId]);

  // A problem on screen goes away as soon as the form changes.
  useEffect(() => {
    setProblem('');
  }, [form, step]);

  const goTo = useCallback((index) => {
    setStep(Math.max(0, Math.min(index, APPLICATION_SECTIONS.length - 1)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const send = useCallback(async () => {
    const missing = applicationProblem(form);
    if (missing) {
      goTo(APPLICATION_SECTIONS.indexOf(missing.section));
      setTimeout(() => setProblem(missing.problem), 0);
      return;
    }
    setSending(true);
    try {
      const response = await base44.functions.invoke('applyAsCreator', applicationPayload(form));
      if (response?.data?.error) throw Object.assign(new Error(response.data.error), { data: response.data });

      sent.current = true;
      // Recording the terms is a second, separate record: if it hiccups it is
      // retried later, never shown as a failed application.
      Promise.all([
        base44.functions.invoke('recordAgreementAcceptance', { documentType: 'terms', documentVersion: TERMS_VERSION }),
        base44.functions.invoke('recordAgreementAcceptance', { documentType: 'privacy', documentVersion: PRIVACY_VERSION }),
      ]).catch(() => {
        try {
          localStorage.setItem('stelli_pending_legal_acceptance', 'true');
        } catch {
          /* nothing to do */
        }
      });
      removeKey(draftKey(userId));
      removeKey(LEGACY_DRAFT_KEY);
      base44.auth
        .updateMe({ creator_draft: {}, creator_draft_step: 'submitted', creator_draft_at: new Date().toISOString() })
        .catch(() => {});
      queryClient.invalidateQueries({ queryKey: [MY_CREATOR_PROFILE_KEY] });
      setStatus('sent');
      window.scrollTo(0, 0);
    } catch (error) {
      const { message, field } = readFailure(error);
      const section = APPLICATION_SECTIONS.indexOf(FIELD_SECTION[field]);
      if (section >= 0) goTo(section);
      setTimeout(() => setProblem(message), 0);
    } finally {
      setSending(false);
    }
  }, [form, userId, queryClient, goTo]);

  const last = step === APPLICATION_SECTIONS.length - 1;

  const next = useCallback(() => {
    if (uploads.uploading) return;
    const stuck = SECTIONS[sectionKey].problem(form);
    if (stuck) {
      setProblem(stuck);
      return;
    }
    if (last) send();
    else goTo(step + 1);
  }, [uploads.uploading, sectionKey, form, last, send, goTo, step]);

  const back = useCallback(() => goTo(step - 1), [goTo, step]);

  return {
    status,
    loadFailed: ownFailed,
    retry: retryOwn,
    form, set, uploads,
    step, last, sectionKey,
    section: SECTIONS[sectionKey],
    total: APPLICATION_SECTIONS.length,
    problem, sending, saved,
    next, back,
  };
}
