import { useCallback, useState } from 'react';
import { emptyForm } from '@/lib/creatorProfile';
import useProfileUploads from '@/hooks/useProfileUploads';

/**
 * The profile form's state, shared by the application and the portal's
 * section editor. `set` takes the fields to change, or a function of the
 * current form that returns them.
 */
export default function useProfileForm(initial) {
  const [form, setForm] = useState(() => initial || emptyForm());

  const set = useCallback((changes) => {
    setForm((prev) => ({ ...prev, ...(typeof changes === 'function' ? changes(prev) : changes) }));
  }, []);

  const uploads = useProfileUploads(set);

  return { form, set, replace: setForm, uploads };
}
