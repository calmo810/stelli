import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  PROMPTS, STEPS, MIN_SHOTS, MAX_SHOTS, MARKET,
  freshState, defaultTiers, isReady, missingReqs, strength, activeTiers,
  buildPayload, slugify, validEmail, shareUrl, shareLabel,
} from '@/lib/wizardData';

const DRAFT_KEY = 'stelli_profile_draft_v2';

function readDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  } catch {
    return null;
  }
}
function writeDraft(data) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    /* a full or blocked store never blocks the wizard */
  }
}
function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nothing to clear */
  }
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
    fullName: contact?.full_name || '',
    email: contact?.email || user?.email || '',
    phone: contact?.phone || '',
    ig: contact?.instagram || '',
  };
}

/**
 * The wizard's whole brain: the profile being built, where the creator is in
 * the flow, uploads, the local draft, and publishing to Stelli.
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
  const [publishing, setPublishing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [saveState, setSaveState] = useState('');

  const loadedRef = useRef(false);
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

  const { data: lensman, isFetched: lensmanFetched } = useQuery({
    queryKey: ['my-lensman-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ user_id: user.id });
      return list[0] || null;
    },
  });

  const { data: contact, isFetched: contactFetched } = useQuery({
    queryKey: ['my-creator-contact', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const list = await base44.entities.CreatorContact.filter({ user_id: user.id });
      return list[0] || null;
    },
  });

  // A creator profile belongs to an account, so building one starts at sign-in.
  useEffect(() => {
    if (!userLoading && !user) base44.auth.redirectToLogin(window.location.pathname);
  }, [userLoading, user]);

  useEffect(() => {
    if (loadedRef.current || userLoading || !user) return;
    // Both lookups must have come back before we can tell a new creator from
    // one who is coming back to a profile they already have.
    if (!lensmanFetched || !contactFetched) return;
    if (lensman) {
      setS(prefill(lensman, contact, user));
      setView('welcome');
    } else {
      const draft = readDraft();
      if (draft) setS({ ...freshState(), ...draft, tiers: Array.isArray(draft.tiers) && draft.tiers.length === 3 ? draft.tiers : defaultTiers() });
    }
    loadedRef.current = true;
    setReady(true);
  }, [user, userLoading, lensman, lensmanFetched, contact, contactFetched]);

  // The draft lives on the device, so a creator can leave and pick it back up.
  useEffect(() => {
    if (!ready) return;
    setSaveState('Saving…');
    const timer = setTimeout(() => {
      writeDraft(s);
      setSaveState('Draft saved');
    }, 500);
    return () => clearTimeout(timer);
  }, [s, ready]);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3200);
  }, []);

  const patch = useCallback((changes) => setS((prev) => ({ ...prev, ...changes })), []);

  const goStep = useCallback((target, { jump = false } = {}) => {
    const next = Math.max(0, Math.min(target, STEPS.length - 1));
    setDir(next >= step ? 1 : -1);
    setView('wizard');
    setStep(next);
    setMaxStep((prev) => Math.max(prev, next));
    setErrMsg('');
    setSheetOpen(false);
    if (!jump) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const validate = useCallback(() => {
    const key = STEPS[step].key;
    if (key === 'name' && !s.name.trim()) return 'Add a name clients can call you.';
    if (key === 'where' && !s.where.length) return 'Pick at least one spot — clients filter by this.';
    if (key === 'what' && !s.what.length) return 'Pick at least one shoot type — it is the first thing clients search.';
    if (key === 'price' && s.tiers.some((tier) => tier.on && tier.price && !tier.name.trim())) return "Give each package you're offering a name.";
    if (key === 'priv' && !validEmail(s.email)) return 'Add a valid email so booking requests can reach you.';
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
      setView('welcome');
      return;
    }
    goStep(step - 1);
  }, [step, goStep]);

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
        what: [...new Set([...prev.what, ...starter.what])],
        bio: starter.bio,
        promptIdx: starter.promptIdx,
        promptA: starter.promptA,
        dont: starter.dont,
      }));
      goStep(0);
      showToast(`Started from ${starter.name} — every word is editable.`);
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
    const room = MAX_SHOTS - s.portfolio.length;
    if (room <= 0) {
      showToast(`Max ${MAX_SHOTS} shots — remove one to add more.`);
      return;
    }
    setUploading(true);
    const added = [];
    for (const file of Array.from(files).slice(0, room)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        added.push({ src: file_url });
      } catch {
        showToast('One of those images could not be uploaded.');
      }
    }
    if (added.length) patch({ portfolio: [...s.portfolio, ...added] });
    setUploading(false);
  }, [s.portfolio, patch, showToast]);

  const publish = useCallback(async () => {
    if (!isReady(s) || publishing) return;
    setPublishing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 700);
    try {
      const payload = buildPayload(s);
      const response = await base44.functions.invoke(lensman ? 'updateCreatorProfile' : 'applyAsCreator', payload);
      const problem = response?.data?.error;
      if (problem) throw new Error(problem);
      if (!lensman) {
        await Promise.all([
          base44.functions.invoke('recordAgreementAcceptance', { documentType: 'terms', documentVersion: '2026-09-10' }),
          base44.functions.invoke('recordAgreementAcceptance', { documentType: 'privacy', documentVersion: '2026-09-10' }),
        ]);
      }
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ['my-lensman-profile'] });
      queryClient.invalidateQueries({ queryKey: ['my-creator-contact'] });
      setView('share');
      window.scrollTo(0, 0);
    } catch (error) {
      showToast(`Couldn't publish — ${error?.message || 'please try again.'}`);
    } finally {
      setPublishing(false);
    }
  }, [s, lensman, publishing, queryClient, showToast]);

  const exit = useCallback(() => {
    writeDraft(s);
    navigate(lensman ? '/lensman-dashboard' : '/');
  }, [s, lensman, navigate]);

  const copy = useCallback(async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message);
    } catch {
      showToast('Could not copy — select it by hand.');
    }
  }, [showToast]);

  const reqs = missingReqs(s);
  const pct = Math.round(((7 - reqs.length) / 7) * 100);

  return {
    user, lensman, contact, ready,
    s, patch, view, setView, step, maxStep, dir,
    errMsg, setErrMsg, toast, showToast, confirm, setConfirm,
    sheetOpen, setSheetOpen, uploading, publishing, flash, saveState,
    goStep, goNext, goBack, applyStarter, validate,
    uploadPhoto, uploadPortfolio, publish, exit, copy,
    missing: reqs, pct, strength: strength(s), readyToPublish: isReady(s),
    approved: lensman?.status === 'approved',
    tiers: activeTiers(s),
    link: shareUrl(s.slug),
    linkLabel: shareLabel(s.slug),
    slugFor: slugify,
    reset: () => {
      clearDraft();
      setConfirm(null);
      setS(freshState());
      setView('welcome');
      setStep(0);
      setMaxStep(0);
    },
    market: MARKET,
    minShots: MIN_SHOTS,
  };
}