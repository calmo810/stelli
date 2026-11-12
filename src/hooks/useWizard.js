import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44, errorMessage } from '@/api/base44Client';
import useCurrentUser from '@/hooks/useCurrentUser';
import { loginUrl } from '@/lib/requireSignIn';
import { STEPS, stepIdx } from '@/lib/wizardData';
import {
  FIELD_STEP, LIMITS, MARKET, MAX_SHOTS, MIN_SHOTS,
  activeTiers, applicableReqs, contactProblems, formToPayload, formToProfile, freshForm,
  missingReqs, normalizeForm, profileToForm, profileUrl, profileUrlLabel, strength, validEmail,
} from '@/lib/creatorProfile';
import { CONTACT_MESSAGE } from '@/lib/contactGuard';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legalDocuments';

/** An application in progress. One per device, until it is sent. */
const APPLICATION_DRAFT_KEY = 'stelli_profile_draft_v2';
/** Unpublished edits to a profile that already exists. One per profile. */
const editDraftKey = (lensmanId) => `stelli_profile_edit_v1_${lensmanId}`;

const store = {
  read(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      return null;
    }
  },
  write(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      /* a full or blocked store never blocks the wizard */
    }
  },
  clear(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* nothing to clear */
    }
  },
};

/** What would be saved, as one string: two forms are "the same" when this matches. */
const fingerprint = (form) => JSON.stringify(formToPayload(form));

/** True when this device holds an application that was started but not sent. */
export function hasApplicationDraft() {
  return Boolean(store.read(APPLICATION_DRAFT_KEY));
}

/**
 * The wizard's whole brain: the profile being built, where the creator is in
 * the flow, uploads, the local draft, and publishing to Stelli.
 *
 * The same wizard creates a profile (/apply) and edits one (/edit-profile).
 * Which one it is doing is decided by whether the account already has a
 * profile, never by the address: someone with a profile always edits it.
 */
export default function useWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [s, setS] = useState(freshForm);
  const [view, setView] = useState('welcome');
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [ready, setReady] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [toast, setToast] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [saveState, setSaveState] = useState('');
  // What is saved on the server, as a fingerprint, for a profile that exists.
  const [published, setPublished] = useState('');

  const loadedRef = useRef(false);
  const toastTimer = useRef(null);

  const { user, isLoading: userLoading } = useCurrentUser();

  // The creator's own full profile (packages included) and private contact
  // details, from the server: some of those fields are readable by founders
  // only, so reading the record directly would come back with them missing,
  // and a save would then wipe them.
  const {
    data: own,
    isFetched: ownFetched,
    isError: ownFailed,
    refetch: refetchOwn,
  } = useQuery({
    queryKey: ['my-creator-profile-full', user?.id],
    enabled: !!user?.id,
    retry: 1,
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyCreatorProfile', {});
      if (response.data?.error) throw new Error(response.data.error);
      return response.data || { lensman: null, contact: null };
    },
  });
  const lensman = own?.lensman || null;
  const contact = own?.contact || null;
  const existing = Boolean(lensman);

  // A creator profile belongs to an account, so building one starts at sign-in.
  useEffect(() => {
    if (!userLoading && !user) window.location.replace(loginUrl());
  }, [userLoading, user]);

  // Loads the form once: from the saved profile, or from this device's draft.
  // A failed load must never look like "no profile yet": that would start a
  // fresh application on top of an existing one, so it shows an error instead.
  useEffect(() => {
    if (loadedRef.current || userLoading || !user || !ownFetched || ownFailed) return;
    loadedRef.current = true;

    const wanted = stepIdx(searchParams.get('step') || '');
    if (lensman) {
      const saved = profileToForm(lensman, contact, user);
      const base = fingerprint(saved);
      const draft = store.read(editDraftKey(lensman.id));
      // Unpublished edits are picked back up only if the profile underneath
      // them has not changed since (an approval, an edit on another device).
      const resumed = draft?.base === base && draft?.form ? normalizeForm(draft.form) : null;
      if (draft && !resumed) store.clear(editDraftKey(lensman.id));
      setS(resumed || saved);
      setPublished(base);
      setMaxStep(STEPS.length - 1);
      if (wanted >= 0) {
        setStep(wanted);
        setView('wizard');
      } else {
        setView('preview');
      }
      if (resumed) showToast('Picked up your unpublished changes.');
    } else {
      const draft = store.read(APPLICATION_DRAFT_KEY);
      const form = draft ? normalizeForm(draft) : freshForm();
      if (!form.email) form.email = user.email || '';
      setS(form);
      if (wanted >= 0) {
        setStep(wanted);
        setMaxStep(wanted);
        setView('wizard');
      }
    }
    // The step in the address is a one-time way in, not a place to live.
    if (searchParams.has('step')) {
      const next = new URLSearchParams(searchParams);
      next.delete('step');
      setSearchParams(next, { replace: true });
    }
    setReady(true);
  }, [user, userLoading, lensman, contact, ownFetched, ownFailed]);

  const dirty = existing && ready && fingerprint(s) !== published;

  // The work in progress lives on the device, so a creator can leave and pick
  // it back up. For a live profile only real, unpublished changes are kept.
  useEffect(() => {
    if (!ready) return undefined;
    if (existing) {
      const key = editDraftKey(lensman.id);
      if (dirty) store.write(key, { base: published, form: s });
      else store.clear(key);
      setSaveState(dirty ? 'Unpublished changes' : 'Up to date');
      return undefined;
    }
    setSaveState('Saving…');
    const timer = setTimeout(() => {
      store.write(APPLICATION_DRAFT_KEY, s);
      setSaveState('Draft saved');
    }, 500);
    return () => clearTimeout(timer);
  }, [s, ready, existing, dirty, published, lensman?.id]);

  // Leaving the tab with unpublished changes to a live page asks first.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3200);
  }, []);

  const patch = useCallback((changes) => {
    setErrMsg('');
    setS((prev) => ({ ...prev, ...changes }));
  }, []);

  const goStep = useCallback((target, { jump = false } = {}) => {
    const next = Math.max(0, Math.min(target, STEPS.length - 1));
    setDir(next >= step ? 1 : -1);
    setView('wizard');
    setStep(next);
    setMaxStep((prev) => Math.max(prev, next));
    setErrMsg('');
    setSheetOpen(false);
    if (!jump) window.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo(0, 0);
  }, [step]);

  /** What is wrong with the step on screen, in the words shown under it. */
  const validate = useCallback((key = STEPS[step].key) => {
    if (key === 'name' && !s.name.trim()) return 'Add a name clients can call you.';
    if (key === 'name' && !s.slug) return 'Use at least one letter or number in your name, so your link works.';
    if (key === 'where' && !s.where.length) return 'Pick at least one spot. Clients filter by this.';
    if (key === 'what' && !s.what.length) return 'Pick at least one shoot type. It is the first thing clients search.';
    if (key === 'price' && s.tiers.some((tier) => tier.on && tier.price && !tier.name.trim())) return "Give each package you're offering a name.";
    if (key === 'prompt' && s.promptA.trim() && !s.prompt) return 'Pick the prompt your answer goes with.';
    if (key === 'priv' && !s.fullName.trim()) return 'Add your full name. Only Stelli sees it.';
    if (key === 'priv' && !validEmail(s.email)) return 'Add a valid email so booking requests can reach you.';
    if (contactProblems(s).includes(key)) return CONTACT_MESSAGE;
    return '';
  }, [step, s]);

  const goNext = useCallback(() => {
    const problem = validate();
    if (problem) {
      setErrMsg(problem);
      return;
    }
    if (step === STEPS.length - 1) {
      setView('preview');
      setSheetOpen(false);
      window.scrollTo(0, 0);
      return;
    }
    goStep(step + 1);
  }, [validate, step, goStep]);

  const goBack = useCallback(() => {
    if (step === 0) {
      // A profile that exists has no "welcome": its home is the review page.
      setView(existing ? 'preview' : 'welcome');
      window.scrollTo(0, 0);
      return;
    }
    goStep(step - 1);
  }, [step, goStep, existing]);

  const openReview = useCallback(() => {
    setView('preview');
    setSheetOpen(false);
    setErrMsg('');
    window.scrollTo(0, 0);
  }, []);

  const applyStarter = useCallback((starter) => {
    if (!starter) return;
    const run = () => {
      setConfirm(null);
      setS((prev) => ({
        ...prev,
        tags: [...starter.tags],
        oneLiner: starter.oneLiner,
        theme: starter.theme,
        accent: starter.accent,
        gallery: starter.gallery,
        layout: starter.layout,
        curve: starter.curve,
        frame: starter.frame,
        mat: starter.mat,
        captions: starter.captions,
        what: [...new Set([...prev.what, ...starter.what])],
        bio: starter.bio,
        prompt: starter.prompt,
        promptA: starter.promptA,
        dont: starter.dont,
      }));
      goStep(0);
      showToast(`Started from ${starter.name}. Every word is editable.`);
    };
    if (s.oneLiner || s.bio || s.tags.length || s.dont) {
      setConfirm({
        title: 'Use this starter style?',
        text: 'It will replace your one-liner, tags, bio, prompt and look.',
        yes: 'Replace',
        onYes: run,
      });
    } else {
      run();
    }
  }, [s, goStep, showToast]);

  const uploadPhoto = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('That file is not an image.');
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      patch({ photo: file_url });
    } catch {
      showToast('That image could not be uploaded.');
    } finally {
      setUploading(false);
    }
  }, [patch, showToast]);

  const uploadPortfolio = useCallback(async (files) => {
    const list = Array.from(files || []);
    const room = MAX_SHOTS - s.portfolio.length;
    if (room <= 0) {
      showToast(`Max ${MAX_SHOTS} shots. Remove one to add more.`);
      return;
    }
    const images = list.filter((file) => file.type.startsWith('image/'));
    if (!images.length) {
      showToast('Those files are not images.');
      return;
    }
    setUploading(true);
    const added = [];
    let failed = 0;
    for (const file of images.slice(0, room)) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        added.push({ src: file_url });
      } catch {
        failed += 1;
      }
    }
    // Added to whatever the portfolio holds NOW: it may have been reordered
    // or trimmed while these were uploading.
    if (added.length) setS((prev) => ({ ...prev, portfolio: [...prev.portfolio, ...added].slice(0, MAX_SHOTS) }));
    setUploading(false);
    if (failed) showToast(failed === 1 ? 'One of those images could not be uploaded.' : `${failed} of those images could not be uploaded.`);
    else if (images.length > room) showToast(`Added ${room}. Max ${MAX_SHOTS} shots.`);
  }, [s.portfolio.length, showToast]);

  const publish = useCallback(async () => {
    if (publishing) return;
    const missing = missingReqs(s, existing);
    if (missing.length) {
      showToast(`Still needed: ${missing[0].t.toLowerCase()}.`);
      return;
    }
    // Every step's own check, so the review page can't publish what a step would refuse.
    const bad = STEPS.find((meta) => validate(meta.key));
    if (bad) {
      goStep(stepIdx(bad.key), { jump: true });
      setErrMsg(validate(bad.key));
      return;
    }
    setPublishing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 700);
    try {
      const payload = formToPayload(s);
      const response = await base44.functions.invoke(existing ? 'updateCreatorProfile' : 'applyAsCreator', payload);
      if (response?.data?.error) throw new Error(response.data.error);
      const saved = response?.data?.lensman || null;
      if (!existing) {
        // The application itself is in. A failed acceptance record is caught
        // again by the legal banner, so it never undoes the application.
        await Promise.allSettled([
          base44.functions.invoke('recordAgreementAcceptance', { documentType: 'terms', documentVersion: TERMS_VERSION }),
          base44.functions.invoke('recordAgreementAcceptance', { documentType: 'privacy', documentVersion: PRIVACY_VERSION }),
        ]);
        store.clear(APPLICATION_DRAFT_KEY);
      } else {
        store.clear(editDraftKey(lensman.id));
      }
      // The link can change on save (a taken name gets a suffix): show the real one.
      const next = saved?.slug && saved.slug !== s.slug ? { ...s, slug: saved.slug } : s;
      if (next !== s) setS(next);
      setPublished(fingerprint(next));
      setMaxStep(STEPS.length - 1);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-lensman-profile'] }),
        queryClient.invalidateQueries({ queryKey: ['my-creator-profile-full'] }),
        queryClient.invalidateQueries({ queryKey: ['has-creator-profile'] }),
        queryClient.invalidateQueries({ queryKey: ['creator'] }),
        queryClient.invalidateQueries({ queryKey: ['creators'] }),
      ]);
      setView('share');
      window.scrollTo(0, 0);
    } catch (error) {
      const field = error?.response?.data?.field;
      const message = errorMessage(error, 'Your profile did not save. Try again.');
      const target = stepIdx(FIELD_STEP[field] || '');
      if (target >= 0) {
        // The server named the field: take the creator straight to it.
        goStep(target, { jump: true });
        setErrMsg(message);
      } else {
        showToast(`Couldn't publish. ${message}`);
      }
    } finally {
      setPublishing(false);
    }
  }, [s, existing, lensman, publishing, queryClient, showToast, validate, goStep]);

  /** Throws away unpublished edits and goes back to what is live. */
  const discardChanges = useCallback(() => {
    if (!existing) return;
    store.clear(editDraftKey(lensman.id));
    setS(profileToForm(lensman, contact, user));
    setConfirm(null);
    setErrMsg('');
    showToast('Changes discarded.');
  }, [existing, lensman, contact, user, showToast]);

  const exit = useCallback(() => {
    if (!existing) store.write(APPLICATION_DRAFT_KEY, s);
    navigate(existing ? '/lensman-dashboard/profile' : '/lensman-dashboard');
  }, [s, existing, navigate]);

  const copy = useCallback(async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message);
    } catch {
      showToast('Could not copy. Select it by hand.');
    }
  }, [showToast]);

  const reset = useCallback(() => {
    store.clear(APPLICATION_DRAFT_KEY);
    setConfirm(null);
    setS({ ...freshForm(), email: user?.email || '' });
    setView('welcome');
    setStep(0);
    setMaxStep(0);
    setErrMsg('');
  }, [user]);

  const reqs = missingReqs(s, existing);
  const reqTotal = applicableReqs(s, existing).length;
  const pct = Math.round(((reqTotal - reqs.length) / reqTotal) * 100);
  // The form as a profile record, for the preview. Drawn by the same component as the public page.
  const profile = useMemo(() => formToProfile(s, lensman), [s, lensman]);

  return {
    user, lensman, contact, ready,
    loadFailed: !userLoading && !!user && ownFetched && ownFailed,
    retryLoad: refetchOwn,
    s, patch, profile, view, setView, step, maxStep, dir,
    errMsg, setErrMsg, toast, showToast, confirm, setConfirm,
    sheetOpen, setSheetOpen, uploading, publishing, flash, saveState,
    goStep, goNext, goBack, openReview, applyStarter, validate,
    uploadPhoto, uploadPortfolio, publish, exit, copy, reset, discardChanges,
    missing: reqs, pct, strength: strength(s), readyToPublish: reqs.length === 0,
    existing, dirty,
    approved: lensman?.status === 'approved',
    tiers: activeTiers(s),
    link: profileUrl({ slug: s.slug }),
    linkLabel: profileUrlLabel({ slug: s.slug }),
    market: MARKET,
    minShots: MIN_SHOTS,
    limits: LIMITS,
  };
}
