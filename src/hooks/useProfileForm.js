import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cleanStyleTags, hasContactDetails, CONTACT_MESSAGE } from '@/lib/profilePresets';
import { fileProblem, readImageSize, softSizeWarning, coverSizeError } from '@/lib/imageQuality';

export const emptyProfile = {
  display_name: '', slug: '', bio: '', one_liner: '', prompt_question: '', prompt_answer: '',
  dont_shoot: '', accent_color: 'lime', profile_theme: 'night_flash', gallery_style: 'hero_grid',
  profile_image: '', portfolio_images: [], specialties: [], neighborhoods: [], style_tags: [],
  cover_image: '', cover_focal_point: { x: 50, y: 50 }, years_experience: '', equipment: '',
  market: 'ELON',
  full_name: '', email: '', phone: '', instagram: '',
};

/** The exact shape that gets saved — also the basis for unsaved-change tracking. */
export function buildPayload(form) {
  return {
    display_name: form.display_name,
    slug: form.slug,
    bio: form.bio,
    one_liner: form.one_liner,
    prompt_question: form.prompt_question,
    prompt_answer: form.prompt_answer,
    dont_shoot: form.dont_shoot,
    accent_color: form.accent_color,
    profile_theme: form.profile_theme,
    gallery_style: form.gallery_style,
    profile_image: form.profile_image,
    portfolio_images: form.portfolio_images || [],
    specialties: form.specialties || [],
    neighborhoods: form.neighborhoods || [],
    style_tags: cleanStyleTags(form.style_tags),
    cover_image: form.cover_image || '',
    cover_focal_point: form.cover_focal_point || { x: 50, y: 50 },
    years_experience: form.years_experience === '' ? '' : Number(form.years_experience),
    equipment: form.equipment || '',
    market: form.market,
    full_name: form.full_name || '',
    email: form.email || '',
    phone: form.phone || '',
    instagram: form.instagram || '',
  };
}

/**
 * Everything the Edit Profile form needs: the loaded profile, the private
 * contact record, uploads, saving, and whether anything has changed.
 */
export default function useProfileForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyProfile);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [uploading, setUploading] = useState(false);
  const [warnings, setWarnings] = useState({});
  const [coverError, setCoverError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [serverError, setServerError] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: lensman, isLoading: profileLoading } = useQuery({
    queryKey: ['my-lensman-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ user_id: user.id });
      return list[0] || null;
    },
  });

  const { data: contact } = useQuery({
    queryKey: ['my-creator-contact', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const list = await base44.entities.CreatorContact.filter({ user_id: user.id });
      return list[0] || null;
    },
  });

  useEffect(() => {
    if (!lensman) return;
    const loaded = {
      ...emptyProfile,
      ...lensman,
      market: lensman.market === 'NYC' ? 'NYC' : 'ELON',
      years_experience: lensman.years_experience ?? '',
      portfolio_images: lensman.portfolio_images || [],
      specialties: lensman.specialties || [],
      neighborhoods: lensman.neighborhoods || [],
      style_tags: cleanStyleTags(lensman.style_tags),
      cover_focal_point: lensman.cover_focal_point || { x: 50, y: 50 },
      full_name: contact?.full_name || '',
      email: contact?.email || user?.email || '',
      phone: contact?.phone || '',
      instagram: contact?.instagram || '',
    };
    setForm(loaded);
    setSavedSnapshot(JSON.stringify(buildPayload(loaded)));
  }, [lensman, contact, user?.email]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateMany = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const payload = useMemo(() => buildPayload(form), [form]);
  const dirty = Boolean(lensman) && JSON.stringify(payload) !== savedSnapshot;

  const contactErrors = useMemo(
    () => ({
      one_liner: hasContactDetails(form.one_liner) ? CONTACT_MESSAGE : '',
      prompt_answer: hasContactDetails(form.prompt_answer) ? CONTACT_MESSAGE : '',
      dont_shoot: hasContactDetails(form.dont_shoot) ? CONTACT_MESSAGE : '',
      bio: hasContactDetails(form.bio) ? CONTACT_MESSAGE : '',
    }),
    [form.one_liner, form.prompt_answer, form.dont_shoot, form.bio]
  );
  const hasContactError = Object.values(contactErrors).some(Boolean);

  const saveProfile = useMutation({
    mutationFn: async (next) => {
      const response = await base44.functions.invoke('updateCreatorProfile', next);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      setServerError(null);
      setSavedSnapshot(JSON.stringify(variables));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
      queryClient.invalidateQueries({ queryKey: ['my-lensman-profile'] });
      queryClient.invalidateQueries({ queryKey: ['my-creator-contact'] });
    },
    onError: (error) => {
      const data = error?.response?.data || {};
      setServerError({
        message: data.error || 'We could not save your profile. Please try again.',
        field: data.field || '',
      });
    },
  });

  const addToPortfolio = (urls) => update('portfolio_images', [...(form.portfolio_images || []), ...urls]);

  const uploadPortfolio = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setUploadError('');
    const urls = [];
    const nextWarnings = { ...warnings };
    for (const file of files) {
      const problem = fileProblem(file);
      if (problem) {
        setUploadError(problem);
        continue;
      }
      try {
        const size = await readImageSize(file);
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
        const warning = softSizeWarning(size);
        if (warning) nextWarnings[file_url] = warning;
      } catch {
        setUploadError('That image could not be uploaded.');
      }
    }
    setWarnings(nextWarnings);
    if (urls.length) addToPortfolio(urls);
    setUploading(false);
  };

  const uploadProfileImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('profile_image', file_url);
    } catch {
      setUploadError('That image could not be uploaded.');
    } finally {
      setUploading(false);
    }
  };

  const uploadCover = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const problem = fileProblem(file);
    if (problem) {
      setCoverError(problem);
      return;
    }
    setUploading(true);
    setCoverError('');
    try {
      const size = await readImageSize(file);
      const tooSmall = coverSizeError(size);
      if (tooSmall) {
        setCoverError(tooSmall);
        return;
      }
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      addToPortfolio([file_url]);
      updateMany({ cover_image: file_url });
    } catch {
      setCoverError('That image could not be uploaded.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const url = form.portfolio_images[index];
    update('portfolio_images', form.portfolio_images.filter((_, i) => i !== index));
    setWarnings((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
    if (form.cover_image === url) updateMany({ cover_image: '' });
  };

  const pinToFront = (index) => {
    const next = Array.from(form.portfolio_images);
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    update('portfolio_images', next);
  };

  const discard = () => {
    if (!savedSnapshot) return;
    setForm(JSON.parse(savedSnapshot));
    setServerError(null);
  };

  const checklist = [
    { key: 'profile_image', label: 'Profile photo', done: Boolean(form.profile_image) },
    { key: 'display_name', label: 'Display name', done: Boolean(String(form.display_name || '').trim()) },
    { key: 'one_liner', label: 'One-liner', done: Boolean(String(form.one_liner || '').trim()) },
    { key: 'bio', label: 'Bio', done: Boolean(String(form.bio || '').trim()) },
    { key: 'specialties', label: 'A specialty', done: (form.specialties || []).length > 0 },
    { key: 'portfolio', label: '3 portfolio photos', done: (form.portfolio_images || []).filter(Boolean).length >= 3 },
  ];

  return {
    user, lensman, contact,
    isLoading: userLoading || profileLoading,
    form, update, updateMany, payload, dirty, checklist,
    contactErrors, hasContactError, serverError, savedFlash,
    warnings, coverError, uploadError, uploading,
    saveProfile, save: () => saveProfile.mutate(payload), discard,
    uploadPortfolio, uploadProfileImage, uploadCover, removeImage, pinToFront,
  };
}