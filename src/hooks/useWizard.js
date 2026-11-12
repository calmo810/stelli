import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  PROMPTS, MIN_SHOTS, MAX_SHOTS, MARKET, FIELD_STEP,
  freshState, defaultTiers, stepsFor, stepProblem, missingReqs, strength, activeTiers,
  buildPayload, slugify, shareUrl, shareLabel, hasContent, REQS,
} from '@/lib/wizardData';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legalDocuments';
import { prepareImage, imageProblemMessage } from '@/lib/prepareImage';
import { applyPendingSignupChoices } from '@/lib/signupChoices';
import { loginUrl } from '@/lib/requireSignIn';

const LEGACY_DRAFT_KEY = 'stelli_profile_draft_v2';
const draftKey = (userId) => `stelli_profile_draft_v3:${userId}`;
const NEXT_STEP_PROMPT_KEY = 'stelli_next_step_prompt';
/** How many photos upload at once. */
const UPLOADS_AT_ONCE = 3;

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
    /* a full or blocked store never blocks the wizard */
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
  const onAccount = user?.creator_draft && typeof user.creator_draft === 'object' && hasDraftContent(user.creator_draft)
    ? user.creator_draft
    : null;
  const onDevice = readJson(draftKey(user.id)) || readJson(LEGACY_DRAFT_KEY);
  if (onAccount && onDevice) {
    return String(onAccount._savedAt || '') > String(onDevice._savedAt || '') ? onAccount : onDevice;
  }
  return onAccount || onDevice;
}

function hasDraftContent(draft) {
  try {
    return hasContent({ ...freshState(), ...draft });
  } catch {
    return false;
  }
}

/** A saved draft, made safe to load whatever version of the wizard wrote it. */
function fromDraft(draft, user) {
  const base = freshState();
  const merged = { ...base, ...draft };
  delete merged._savedAt;
  delete merged._step;
  for (const field of ['tags', 'where', 'what', 'portfolio']) {
    if (!Array.isArray(merged[field])) merged[field] = base[field];
  }
  merged.portfolio = merged.portfolio.filter((item) => item && item.src);
  merged.tiers = Array.isArray(merged.tiers) && merged.tiers.length === 3 ? merged.tiers : defaultTiers();
  merged.fullName = merged.fullName || user?.full_name || '';
  merged.email = merged.email || user?.email || '';
  return merged;
}

/** Turns a saved creator profile back into wizard state. */
function prefill(lensman, contact, user) {
  const base = freshState();
  const portfolio = (lensman.portfolio_images || []).filter(Boolean).map((src) => ({ src }));
  const coverIdx = portfolio.findIndex((item) => item.src === lensman.cover_image);
  const saved = Array.isArray(lensman.pricing_tiers) ? lensman.pricing_tiers : [];
  const tiers = base.tiers.map((tier, i) => {
    const match = saved.find((entry) => entry?.tier === ['low', 'mid', 'high'][i]) || saved[i];
    if (!match) return tier;
    return {
      on: Number(match.price) > 0,
      name: match.name || tier.name,
      price: match.price ? String(match.price) : '',
      duration: match.duration || tier.duration,
      includes: match.includes || '',
    };
  });
  const promptIdx = PROMPTS.indexOf(lensman.prompt_question);
  return {
    ...base,
    photo: lensman.profile_image || null,
    name: lensman.display_name || '',
    slug: lensman.slug || '',
    oneLiner: lensman.one_liner || '',
    tags: lensman.style_tags || [],
    where: lensman.neighborhoods || [],
    what: lensman.specialties || [],
    portfolio,
    cover: coverIdx < 0 ? 0 : coverIdx,
    tiers,
    bio: lensman.bio || '',
    equip: lensman.equipment || '',
    years: lensman.years_experience != null ? String(lensman.years_experience) : '',
    promptIdx: promptIdx < 0 ? null : promptIdx,
    promptA: lensman.prompt_answer || '',
    dont: lensman.dont_shoot || '',
    theme: lensman.profile_theme === 'clean_portfolio' ? 'clean' : 'night',
    accent: lensman.accent_color || 'lime',
    gallery: { hero_grid: 'hero', ordered_grid: 'ordered', contact_sheet: 'contact' }[lensman.gallery_style] || 'hero',
    layout: lensman.wall_layout || 'wall',
    curve: lensman.wall_curve || 'soft',
    frame: lensman.print_frame || 'mat',
    mat: lensman.print_mat || 'mixed',
    captions: lensman.show_captions !== false,
    fullName: contact?.full_name || user?.full_name || '',
    email: contact?.email || user?.email || '',
    phone: contact?.phone || '',
    ig: contact?.instagram || '',
  };
}

/** The message a failed save came back with, and the field it was about. */
function readFailure(error) {
  const data = error?.response?.data || error?.data || {};
  return {
    message: data.error || error?.message || 'Please try again.',
    field: data.field || '',
  };
}

/**
 * The wizard's whole brain: the profile being built, where the creator is in
 * the flow, uploads, the saved draft, and sending it to Stelli.
 *
 * Without a profile it is the application (four screens, then send). With one
 * it is the page editor (every step, then a review screen).
 */
export default function useWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [s, setS] = useState(freshState);
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
  const [uploadNote, setUploadNote] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [saveState, setSaveState] = useState('');
  const [justSent, setJustSent] = useState('');

  const loadedRef = useRef(false);
  const settledRef = useRef(false);
  // Set the moment an application goes in, so a draft save already on its way
  // can't write the draft back over "submitted".
  const sentRef = useRef(false);
  const toastTimer = useRef(null);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  // The creator's own full profile (packages included) and private contact
  // details, from the server: some of those fields are readable by founders
  // only, so reading the record directly would come back with them missing,
  // and a save would then wipe them.
  const { data: own, isFetched: ownFetched, isError: ownFailed } = useQuery({
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
  // A failed load must never look like "no profile yet": that would start a
  // fresh application on top of an existing one.
  const lensmanFetched = ownFetched && !ownFailed;

  const applying = !lensman;
  const steps = useMemo(() => stepsFor(!applying), [applying]);
  const needsChanges = lensman?.status === 'needs_changes';

  // A creator profile belongs to an account. Someone new who taps "Apply" goes
  // to creator signup and comes straight back here; someone editing logs in.
  useEffect(() => {
    if (userLoading || user) return;
    const here = window.location.pathname;
    window.location.replace(
      here === '/apply' ? `/register?role=creator&returnTo=${encodeURIComponent(here)}` : loginUrl(here)
    );
  }, [userLoading, user]);

  // Arriving here straight from signup skips the portal, so this page finishes
  // what the portal would have: the account type chosen before a Google
  // sign-in, and no "ready to apply?" prompt waiting for later.
  useEffect(() => {
    if (!user || settledRef.current) return;
    settledRef.current = true;
    (async () => {
      const current = await applyPendingSignupChoices(user);
      if (!current?.account_type && window.location.pathname === '/apply') {
        await base44.auth.updateMe({ account_type: 'creator' }).catch(() => {});
      }
      try {
        if (localStorage.getItem(NEXT_STEP_PROMPT_KEY) === 'creator') localStorage.removeItem(NEXT_STEP_PROMPT_KEY);
      } catch {
        /* nothing to clear */
      }
    })();
  }, [user]);

  useEffect(() => {
    if (loadedRef.current || userLoading || !user) return;
    // The profile lookup must have come back before we can tell a new creator
    // from one who is coming back to a profile they already have.
    if (!lensmanFetched) return;
    if (lensman) {
      setS(prefill(lensman, contact, user));
      // An existing page can be opened at any step.
      setMaxStep(stepsFor(true).length - 1);
    } else {
      const draft = newestDraft(user);
      if (draft) {
        setS(fromDraft(draft, user));
        const resumeAt = stepsFor(false).findIndex((item) => item.key === draft._step);
        if (resumeAt > 0) setMaxStep(resumeAt);
      } else {
        setS((prev) => ({ ...prev, fullName: user.full_name || '', email: user.email || '' }));
      }
    }
    setView('welcome');
    loadedRef.current = true;
    setReady(true);
  }, [user, userLoading, lensman, lensmanFetched, contact]);

  // An application in progress is saved twice: in this browser right away, and
  // on the account a moment later, so it can be picked up on another device
  // (start on a phone, finish on the laptop with the photos).
  const stepKey = steps[Math.min(step, steps.length - 1)]?.key;
  const userId = user?.id;
  useEffect(() => {
    if (!ready || !userId || !applying) return undefined;
    setSaveState('Saving…');
    const draft = { ...s, _savedAt: new Date().toISOString(), _step: stepKey };
    const local = setTimeout(() => {
      if (sentRef.current) return;
      writeJson(draftKey(userId), draft);
      removeKey(LEGACY_DRAFT_KEY);
      setSaveState('Draft saved');
    }, 500);
    const remote = setTimeout(() => {
      if (sentRef.current || !hasContent(s)) return;
      base44.auth
        .updateMe({ creator_draft: draft, creator_draft_step: stepKey, creator_draft_at: draft._savedAt })
        .catch(() => {});
    }, 2500);
    return () => {
      clearTimeout(local);
      clearTimeout(remote);
    };
  }, [s, stepKey, ready, userId, applying]);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4200);
  }, []);

  const patch = useCallback((changes) => setS((prev) => ({ ...prev, ...changes })), []);

  const goStep = useCallback((target, { jump = false } = {}) => {
    const next = Math.max(0, Math.min(target, steps.length - 1));
    setDir(next >= step ? 1 : -1);
    setView('wizard');
    setStep(next);
    setMaxStep((prev) => Math.max(prev, next));
    setErrMsg('');
    setSheetOpen(false);
    if (!jump) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, steps]);

  /** Opens the step a given key lives on, if this flow has it. */
  const goKey = useCallback((key, options = { jump: true }) => {
    const index = steps.findIndex((item) => item.key === key);
    if (index >= 0) goStep(index, options);
    return index >= 0;
  }, [steps, goStep]);

  const validate = useCallback(() => stepProblem(steps[step]?.key, s), [steps, step, s]);

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
        promptIdx: starter.promptIdx,
        promptA: starter.promptA,
        dont: starter.dont,
      }));
      if (!goKey('line', { jump: false })) goStep(0);
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
  }, [s, goKey, goStep, showToast]);

  /** One file, made web-ready and uploaded. Throws with a reason on failure. */
  const uploadOne = useCallback(async (file) => {
    const prepared = await prepareImage(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: prepared });
    if (!file_url) throw new Error('upload');
    return file_url;
  }, []);

  const uploadPhoto = useCallback(async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      patch({ photo: await uploadOne(file) });
      setErrMsg('');
    } catch (error) {
      showToast(imageProblemMessage(error));
    } finally {
      setUploading(false);
    }
  }, [patch, uploadOne, showToast]);

  const uploadPortfolio = useCallback(async (files) => {
    const room = MAX_SHOTS - s.portfolio.length;
    if (room <= 0) {
      showToast(`Max ${MAX_SHOTS} shots. Remove one to add more.`);
      return;
    }
    const picked = Array.from(files || []);
    const queue = picked.slice(0, room);
    if (!queue.length) return;

    setUploading(true);
    let done = 0;
    let lastProblem = null;
    const results = new Array(queue.length).fill(null);
    const note = () => setUploadNote(`Uploading ${Math.min(done + 1, queue.length)} of ${queue.length}…`);
    note();

    // A few at a time, in the order they were picked.
    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const index = cursor;
        cursor += 1;
        try {
          results[index] = await uploadOne(queue[index]);
        } catch (error) {
          lastProblem = error;
        }
        done += 1;
        if (done < queue.length) note();
      }
    };
    await Promise.all(Array.from({ length: Math.min(UPLOADS_AT_ONCE, queue.length) }, worker));

    const added = results.filter(Boolean).map((src) => ({ src }));
    if (added.length) {
      setS((prev) => ({ ...prev, portfolio: [...prev.portfolio, ...added].slice(0, MAX_SHOTS) }));
      setErrMsg('');
    }
    const failed = queue.length - added.length;
    if (failed) {
      showToast(
        failed === 1 && queue.length === 1
          ? imageProblemMessage(lastProblem)
          : `${failed} of ${queue.length} could not be added. ${imageProblemMessage(lastProblem)}`
      );
    } else if (picked.length > queue.length) {
      showToast(`Added ${queue.length}. The max is ${MAX_SHOTS} shots.`);
    }
    setUploading(false);
    setUploadNote('');
  }, [s.portfolio.length, uploadOne, showToast]);

  const publish = useCallback(async () => {
    if (publishing) return;
    const missing = missingReqs(s);
    if (missing.length) {
      if (goKey(missing[0].k)) setErrMsg(stepProblem(missing[0].k, s) || `Still needed: ${missing[0].t}.`);
      return;
    }
    if (uploading) {
      showToast('Hang on, your photos are still uploading.');
      return;
    }
    setPublishing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 700);
    try {
      const payload = buildPayload(s);
      const response = applying
        ? await base44.functions.invoke('applyAsCreator', payload)
        : await base44.functions.invoke('updateCreatorProfile', { ...payload, resubmit: needsChanges });
      const problem = response?.data?.error;
      if (problem) {
        const failure = new Error(problem);
        failure.data = response.data;
        throw failure;
      }

      if (applying) {
        // The application is in. Recording the terms is a second, separate
        // record: if it hiccups it is retried later, never shown as a failed
        // application.
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
        sentRef.current = true;
        removeKey(draftKey(user.id));
        removeKey(LEGACY_DRAFT_KEY);
        base44.auth
          .updateMe({ creator_draft: {}, creator_draft_step: 'submitted', creator_draft_at: new Date().toISOString() })
          .catch(() => {});
      }

      setJustSent(applying ? 'applied' : response?.data?.resubmitted ? 'resubmitted' : 'saved');
      queryClient.invalidateQueries({ queryKey: ['my-lensman-profile'] });
      // Wait for the saved profile, so the page steps are there to walk into.
      await queryClient.refetchQueries({ queryKey: ['my-creator-profile-full'] }).catch(() => {});
      setView('share');
      window.scrollTo(0, 0);
    } catch (error) {
      const { message, field } = readFailure(error);
      const key = FIELD_STEP[field];
      if (key && goKey(key)) setErrMsg(message);
      else showToast(`That didn't go through. ${message}`);
    } finally {
      setPublishing(false);
    }
  }, [s, applying, needsChanges, publishing, uploading, user, queryClient, showToast, goKey]);

  const goNext = useCallback(() => {
    const problem = validate();
    if (problem) {
      setErrMsg(problem);
      return;
    }
    if (step === steps.length - 1) {
      // The application sends from its last screen. A page gets a review first.
      if (applying) {
        publish();
        return;
      }
      setView('preview');
      setSheetOpen(false);
      window.scrollTo(0, 0);
      return;
    }
    goStep(step + 1);
  }, [validate, step, steps, applying, publish, goStep]);

  const goBack = useCallback(() => {
    if (step === 0) {
      setView('welcome');
      return;
    }
    goStep(step - 1);
  }, [step, goStep]);

  const exit = useCallback(() => {
    if (applying && user) writeJson(draftKey(user.id), { ...s, _savedAt: new Date().toISOString(), _step: stepKey });
    navigate(lensman ? '/lensman-dashboard' : '/');
  }, [s, stepKey, applying, user, lensman, navigate]);

  const copy = useCallback(async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message);
    } catch {
      showToast('Could not copy. Select it by hand.');
    }
  }, [showToast]);

  const reqs = missingReqs(s);
  const pct = Math.round(((REQS.length - reqs.length) / REQS.length) * 100);

  return {
    user, lensman, contact, ready,
    s, patch, view, setView, step, maxStep, dir,
    steps, applying, needsChanges, justSent,
    changesNote: needsChanges ? contact?.changes_requested || '' : '',
    errMsg, setErrMsg, toast, showToast, confirm, setConfirm,
    sheetOpen, setSheetOpen, uploading, uploadNote, publishing, flash, saveState,
    goStep, goKey, goNext, goBack, applyStarter, validate,
    uploadPhoto, uploadPortfolio, publish, exit, copy,
    missing: reqs, pct, strength: strength(s), readyToPublish: reqs.length === 0,
    approved: lensman?.status === 'approved',
    tiers: activeTiers(s),
    link: shareUrl(s.slug),
    linkLabel: shareLabel(s.slug),
    slugFor: slugify,
    reset: () => {
      if (user) removeKey(draftKey(user.id));
      removeKey(LEGACY_DRAFT_KEY);
      if (user && applying) base44.auth.updateMe({ creator_draft: {} }).catch(() => {});
      setConfirm(null);
      setS({ ...freshState(), fullName: user?.full_name || '', email: user?.email || '' });
      setView('welcome');
      setStep(0);
      setMaxStep(0);
    },
    market: MARKET,
    minShots: MIN_SHOTS,
  };
}
