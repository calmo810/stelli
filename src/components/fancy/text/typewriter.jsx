import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

const blink = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.01, repeat: Infinity, repeatDelay: 0.4, repeatType: 'reverse' },
  },
};

/**
 * Types each string, holds it, deletes it, and moves on to the next.
 * Same props as the fancycomponents.dev Typewriter.
 */
export default function Typewriter({
  text,
  as: Tag = 'span',
  speed = 50,
  initialDelay = 0,
  waitTime = 2000,
  deleteSpeed = 30,
  loop = true,
  className,
  showCursor = true,
  hideCursorOnType = false,
  cursorChar = '|',
  cursorClassName = 'ml-1',
  cursorAnimationVariants = blink,
  startOnVisible = false,
  ...props
}) {
  const texts = Array.isArray(text) ? text : [text];
  // Keyed on the words, not the array, so a parent re-render never resets the timer.
  const textsKey = texts.join('\u0000');
  const [shown, setShown] = useState('');
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const started = !startOnVisible || inView;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = (event) => setReducedMotion(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!started || reducedMotion) return undefined;

    const current = texts[index] || '';
    const atStart = index === 0 && charIndex === 0 && !deleting && shown === '';
    let delay = deleting ? deleteSpeed : speed;
    let step;

    if (deleting) {
      if (shown === '') {
        const last = index === texts.length - 1;
        if (last && !loop) return undefined;
        step = () => {
          setDeleting(false);
          setIndex(last ? 0 : index + 1);
          setCharIndex(0);
        };
        delay = 0;
      } else {
        step = () => setShown((prev) => prev.slice(0, -1));
      }
    } else if (charIndex < current.length) {
      step = () => {
        setShown((prev) => prev + current[charIndex]);
        setCharIndex((prev) => prev + 1);
      };
      if (atStart) delay = initialDelay || speed;
    } else {
      if (!loop && index === texts.length - 1) return undefined;
      step = () => setDeleting(true);
      delay = waitTime;
    }

    const timeout = setTimeout(step, delay);
    return () => clearTimeout(timeout);
  }, [started, reducedMotion, shown, index, charIndex, deleting, textsKey, speed, deleteSpeed, waitTime, initialDelay, loop]);

  // Without motion, the first line simply sits there.
  const visible = reducedMotion ? texts[0] : shown;
  const typing = !reducedMotion && (charIndex < (texts[index] || '').length || deleting);

  return (
    <Tag ref={ref} className={cn('inline whitespace-pre-wrap tracking-tight', className)} {...props}>
      <span className="sr-only">{texts.join(', ')}</span>
      <span aria-hidden="true">{visible}</span>
      {showCursor && !reducedMotion && (
        <motion.span
          aria-hidden="true"
          variants={cursorAnimationVariants}
          className={cn(cursorClassName, hideCursorOnType && typing ? 'hidden' : '')}
          initial="initial"
          animate="animate"
        >
          {cursorChar}
        </motion.span>
      )}
    </Tag>
  );
}
