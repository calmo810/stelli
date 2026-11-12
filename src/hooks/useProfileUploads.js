import { useCallback, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { MAX_SHOTS } from '@/lib/creatorProfile';
import { prepareImage, imageProblemMessage } from '@/lib/prepareImage';

/** How many photos upload at once. */
const AT_ONCE = 3;

async function uploadOne(file) {
  const prepared = await prepareImage(file);
  const { file_url } = await base44.integrations.Core.UploadFile({ file: prepared });
  if (!file_url) throw new Error('upload');
  return file_url;
}

/**
 * Photo uploads for the profile form: the face photo and the portfolio.
 * Every file is made web-ready first (resized, HEIC converted or refused), a
 * portfolio uploads a few at a time in the order picked, and anything that
 * fails says why. `set` is the form's setter.
 */
export default function useProfileUploads(set) {
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState('');

  const uploadPhoto = useCallback(async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadOne(file);
      set({ photo: url });
    } catch (error) {
      toast({ title: imageProblemMessage(error) });
    } finally {
      setUploading(false);
    }
  }, [set]);

  const uploadPortfolio = useCallback(async (files, have) => {
    const room = MAX_SHOTS - have;
    if (room <= 0) {
      toast({ title: `The max is ${MAX_SHOTS} shots. Remove one to add more.` });
      return;
    }
    const picked = Array.from(files || []);
    const queue = picked.slice(0, room);
    if (!queue.length) return;

    setUploading(true);
    let done = 0;
    let lastProblem = null;
    const results = new Array(queue.length).fill(null);
    const say = () => setNote(`Uploading ${Math.min(done + 1, queue.length)} of ${queue.length}…`);
    say();

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
        if (done < queue.length) say();
      }
    };
    await Promise.all(Array.from({ length: Math.min(AT_ONCE, queue.length) }, worker));

    const added = results.filter(Boolean).map((src) => ({ src }));
    if (added.length) {
      set((prev) => ({ portfolio: [...prev.portfolio, ...added].slice(0, MAX_SHOTS) }));
    }
    const failed = queue.length - added.length;
    if (failed) {
      toast({
        title: failed === queue.length && queue.length === 1 ? imageProblemMessage(lastProblem) : `${failed} of ${queue.length} could not be added.`,
        description: failed === queue.length && queue.length === 1 ? undefined : imageProblemMessage(lastProblem),
      });
    } else if (picked.length > queue.length) {
      toast({ title: `Added ${queue.length}. The max is ${MAX_SHOTS} shots.` });
    }
    setUploading(false);
    setNote('');
  }, [set]);

  return { uploading, note, uploadPhoto, uploadPortfolio };
}
