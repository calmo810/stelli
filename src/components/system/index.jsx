/**
 * The design system's building blocks, as components.
 *
 * Every class they use is defined in src/styles/system.css, which also
 * explains the two surfaces (ink and paper). Screens are built from these
 * rather than from one-off markup, so a button is the same button everywhere.
 */
import React, { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check as CheckIcon, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ---------------- layout ---------------- */

const WIDTHS = {
  default: '',
  form: 'st-wrap--form',
  narrow: 'st-wrap--narrow',
  reading: 'st-wrap--reading',
  wide: 'st-wrap--wide',
};

/** A screen on the ink stage: one measured column with room to breathe. */
/** @param {Record<string, any>} props */
export function Page({ width = 'default', className = '', children, ...rest }) {
  return (
    <div className="st-page st-ink" {...rest}>
      <div className={cn('st-wrap pb-16 pt-4 md:pb-24 md:pt-8', WIDTHS[width], className)}>{children}</div>
    </div>
  );
}

/** The bright sheet a screen's content sits on. Everything inside reads dark-on-light. */
/** @param {Record<string, any>} props */
export function Sheet({ as: Tag = 'div', flush = false, className = '', children, ...rest }) {
  return (
    <Tag className={cn('st-sheet st-paper', flush && 'st-sheet--flush', className)} {...rest}>
      {children}
    </Tag>
  );
}

/** The top of a screen: a quiet line, the headline, a sentence, and what you can do. */
/** @param {Record<string, any>} props */
export function PageHeader({ kicker, title, lede, actions, back, level = 'h1', className = '' }) {
  const Heading = level;
  return (
    <header className={cn('flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {back && (
          <Link to={back.to} className="mb-4 inline-flex min-h-[32px] items-center gap-1.5 text-[13px] font-semibold text-fg-3 transition-colors hover:text-fg">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {back.label}
          </Link>
        )}
        {kicker && <p className="st-kicker mb-2.5">{kicker}</p>}
        <Heading className="st-h1">{title}</Heading>
        {lede && <p className="st-lede mt-3">{lede}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ---------------- actions ---------------- */

const BTN_VARIANT = {
  primary: 'st-btn--primary',
  lime: 'st-btn--lime',
  ink: 'st-btn--ink',
  white: 'st-btn--white',
  outline: 'st-btn--outline',
  soft: 'st-btn--soft',
  ghost: 'st-btn--ghost',
  danger: 'st-btn--danger',
};
const BTN_SIZE = { sm: 'st-btn--sm', md: '', lg: 'st-btn--lg' };

/**
 * The one button. `to` makes it a link, `href` an outside link, otherwise it
 * is a real <button>. `arrow` adds the round arrow: "end", "start" or "up".
 */
/** @type {React.ForwardRefExoticComponent<Record<string, any> & React.RefAttributes<any>>} */
export const Btn = React.forwardRef(function Btn(
  { to, href, variant = 'primary', size = 'md', block = false, arrow = '', loading = false, disabled = false, className = '', children, type, ...rest },
  ref
) {
  const cls = cn('st-btn', BTN_VARIANT[variant], BTN_SIZE[size], block && 'st-btn--block', className);
  const Arrow = arrow === 'up' ? ArrowUpRight : ArrowRight;
  const dot = arrow ? (
    <span className="st-btn__dot" aria-hidden>
      <Arrow strokeWidth={2.4} />
    </span>
  ) : null;
  const inner = (
    <>
      {arrow === 'start' && dot}
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
      {arrow && arrow !== 'start' && dot}
    </>
  );
  const off = disabled || loading;

  if (to && !off) {
    return (
      <Link ref={ref} to={to} className={cls} {...rest}>
        {inner}
      </Link>
    );
  }
  if (href && !off) {
    return (
      <a ref={ref} href={href} className={cls} {...rest}>
        {inner}
      </a>
    );
  }
  return (
    <button ref={ref} type={type || 'button'} className={cls} disabled={off} aria-busy={loading || undefined} {...rest}>
      {inner}
    </button>
  );
});

/** A round button that is only an icon. It always carries a spoken label. */
/** @type {React.ForwardRefExoticComponent<Record<string, any> & React.RefAttributes<any>>} */
export const IconBtn = React.forwardRef(function IconBtn(
  { label, to, href, variant = 'line', size = 'md', className = '', children, type, ...rest },
  ref
) {
  const cls = cn('st-icon-btn', variant === 'solid' && 'st-icon-btn--solid', variant === 'soft' && 'st-icon-btn--soft', size === 'sm' && 'st-icon-btn--sm', className);
  if (to) {
    return (
      <Link ref={ref} to={to} className={cls} aria-label={label} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={cls} aria-label={label} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button ref={ref} type={type || 'button'} className={cls} aria-label={label} {...rest}>
      {children}
    </button>
  );
});

/* ---------------- surfaces ---------------- */

const CARD_TONE = {
  paper: '',
  soft: 'st-card--soft',
  flat: 'st-card--flat',
  ink: 'st-card--ink',
  lime: 'st-card--lime',
  sky: 'st-card--sky',
  blush: 'st-card--blush',
  butter: 'st-card--butter',
  lilac: 'st-card--lilac',
  peach: 'st-card--peach',
};

/** @param {Record<string, any>} props */
export function Card({ as: Tag = 'div', tone = 'paper', pad = true, large = false, hover = false, className = '', children, ...rest }) {
  return (
    <Tag className={cn('st-card', CARD_TONE[tone], pad && 'st-card--pad', large && 'st-card--lg', hover && 'st-card--hover', className)} {...rest}>
      {children}
    </Tag>
  );
}

const CHIP_TONE = {
  neutral: '',
  lime: 'st-chip--lime',
  sky: 'st-chip--sky',
  blush: 'st-chip--blush',
  butter: 'st-chip--butter',
  lilac: 'st-chip--lilac',
  ink: 'st-chip--ink',
  neon: 'st-chip--neon',
  line: 'st-chip--line',
};

/** @param {Record<string, any>} props */
export function Chip({ as: Tag = 'span', tone = 'neutral', large = false, className = '', children, ...rest }) {
  return (
    <Tag className={cn('st-chip', CHIP_TONE[tone], large && 'st-chip--lg', className)} {...rest}>
      {children}
    </Tag>
  );
}

/** @param {Record<string, any>} props */
export function Avatar({ src, name = '', size = 'md', ring = false, className = '' }) {
  const sizes = { sm: 'st-avatar--sm', md: '', lg: 'st-avatar--lg', xl: 'st-avatar--xl' };
  return (
    <span className={cn('st-avatar', sizes[size], ring && 'st-avatar--ring', className)} aria-hidden>
      {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : (String(name).trim()[0] || '?').toUpperCase()}
    </span>
  );
}

/** One big number and what it counts. */
/** @param {Record<string, any>} props */
export function Stat({ value, label, icon: Icon, className = '' }) {
  return (
    <div className={cn('st-stat', className)}>
      <p className="st-stat__value">
        {Icon && <Icon aria-hidden />}
        {value}
      </p>
      <p className="st-stat__label">{label}</p>
    </div>
  );
}

/* ---------------- lists ---------------- */

/** One row in a `.st-list`. A link when it has `to`, a button with `onClick`, otherwise plain. */
/** @param {Record<string, any>} props */
export function Row({ to, href, onClick, leading, title, meta, trailing, chevron = true, className = '', ...rest }) {
  const interactive = Boolean(to || href || onClick);
  const inner = (
    <>
      {leading}
      <span className="st-row__main">
        <span className="st-row__title">{title}</span>
        {meta && <span className="st-row__meta">{meta}</span>}
      </span>
      {trailing}
      {interactive && chevron && <ChevronRight className="st-row__chev" strokeWidth={2.4} aria-hidden />}
    </>
  );
  const cls = cn('st-row', className);
  if (to) return <Link to={to} className={cls} {...rest}>{inner}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{inner}</a>;
  if (onClick) return <button type="button" onClick={onClick} className={cls} {...rest}>{inner}</button>;
  return <div className={cls} {...rest}>{inner}</div>;
}

/* ---------------- forms ---------------- */

/**
 * A labelled control. Pass the control as the child; it is given the id, and
 * the hint or error is tied to it for screen readers.
 */
/** @param {Record<string, any>} props */
export function Field({ label, optional = false, hint, error, counter, className = '', children }) {
  const id = useId();
  const child = React.Children.only(children);
  const controlId = child.props.id || id;
  const describedBy = error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined;
  return (
    <div className={cn('st-field', className)}>
      {label && (
        <label className="st-label" htmlFor={controlId}>
          <span>
            {label}
            {optional && <small> · optional</small>}
          </span>
          {counter && <small aria-hidden>{counter}</small>}
        </label>
      )}
      {React.cloneElement(child, {
        id: controlId,
        'aria-describedby': child.props['aria-describedby'] || describedBy,
        'aria-invalid': error ? true : child.props['aria-invalid'],
      })}
      {error ? (
        <p id={`${controlId}-error`} className="st-error" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${controlId}-hint`} className="st-hint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** A tick box with its sentence. The whole line is the target. */
/** @param {Record<string, any>} props */
export function Check({ checked, onChange, children, className = '', ...rest }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={Boolean(checked)}
      onClick={() => onChange(!checked)}
      className={cn('st-check', className)}
      {...rest}
    >
      <span className="st-check__box" aria-hidden>
        <CheckIcon strokeWidth={3.2} />
      </span>
      <span>{children}</span>
    </button>
  );
}

/**
 * A pill track with one pill inside it. `options` are { value, label, count }.
 * `ink` is the dark track with a lime pill, used for section navigation.
 */
/** @param {Record<string, any>} props */
export function Segmented({ value, onChange, options, label, ink = false, block = false, className = '' }) {
  return (
    <div role="tablist" aria-label={label} className={cn('st-seg', ink && 'st-seg--ink', block && 'st-seg--block', className)}>
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button key={String(option.value)} type="button" role="tab" aria-selected={on} onClick={() => onChange(option.value)}>
            {option.label}
            {typeof option.count === 'number' && <small>{option.count}</small>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- states ---------------- */

/** @param {Record<string, any>} props */
export function Spinner({ label = 'Loading', className = '' }) {
  return <span className={cn('st-spinner', className)} role="status" aria-label={label} />;
}

/** A centred "still loading" block for a whole panel. */
/** @param {Record<string, any>} props */
export function Loading({ label = 'Loading', className = '' }) {
  return (
    <div className={cn('grid min-h-[220px] place-items-center', className)}>
      <Spinner label={label} />
    </div>
  );
}

/** @param {Record<string, any>} props */
export function Skeleton({ className = '', ...rest }) {
  return <div className={cn('st-skeleton', className)} aria-hidden {...rest} />;
}

/** What an empty list says instead of nothing. */
/** @param {Record<string, any>} props */
export function EmptyState({ icon: Icon, title, body, action, className = '' }) {
  return (
    <div className={cn('st-empty', className)}>
      {Icon && (
        <span className="st-empty__icon" aria-hidden>
          <Icon strokeWidth={1.8} />
        </span>
      )}
      <p className="st-empty__title">{title}</p>
      {body && <p className="st-empty__body">{body}</p>}
      {action && <div className="st-empty__action">{action}</div>}
    </div>
  );
}

/** Something failed to load: say so, and offer the way to try again. */
/** @param {Record<string, any>} props */
export function ErrorState({ title = "This didn't load.", body = 'Check your connection and try again.', onRetry, action, className = '' }) {
  return (
    <div className={cn('st-empty', className)} role="alert">
      <span className="st-empty__icon" aria-hidden>
        <AlertTriangle strokeWidth={1.8} />
      </span>
      <p className="st-empty__title">{title}</p>
      {body && <p className="st-empty__body">{body}</p>}
      <div className="st-empty__action">
        {action || (
          onRetry && (
            <Btn variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Btn>
          )
        )}
      </div>
    </div>
  );
}

const NOTE_TONE = { neutral: '', info: 'st-note--info', warn: 'st-note--warn', error: 'st-note--error', success: 'st-note--success' };

/** A short message in a tinted band. An error note is announced to screen readers. */
/** @param {Record<string, any>} props */
export function Note({ tone = 'neutral', icon: Icon, className = '', children, ...rest }) {
  return (
    <div className={cn('st-note', NOTE_TONE[tone], className)} role={tone === 'error' ? 'alert' : undefined} {...rest}>
      {Icon && <Icon aria-hidden />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/* ---------------- overlays ---------------- */

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A modal sheet: slides up from the bottom on a phone, sits centred on a
 * larger screen. Focus moves into it, stays in it, and goes back where it was
 * when it closes; Escape and the backdrop close it unless `busy`.
 */
/** @param {Record<string, any>} props */
export function Dialog({ open, onClose, title, kicker, busy = false, wide = false, children, className = '' }) {
  const titleId = useId();
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const el = panel.current;
    const first = el?.querySelector('[data-autofocus]') || el?.querySelector(FOCUSABLE);
    (first || el)?.focus?.();

    const onKey = (event) => {
      if (event.key === 'Escape' && !busy) {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab' || !el) return;
      const items = [...el.querySelectorAll(FOCUSABLE)].filter((node) => node.offsetParent !== null);
      if (!items.length) return;
      const [start, end] = [items[0], items[items.length - 1]];
      if (event.shiftKey && document.activeElement === start) {
        event.preventDefault();
        end.focus();
      } else if (!event.shiftKey && document.activeElement === end) {
        event.preventDefault();
        start.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div className="st-scrim" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose?.()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn('st-dialog st-paper', wide && 'sm:max-w-[620px]', className)}
      >
        {kicker && <p className="st-kicker mb-2">{kicker}</p>}
        {title && (
          <h2 id={titleId} className="st-h2">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
