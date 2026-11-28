import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
export function StudentDetailPortal({ open, title, eyebrow = "Student record", onClose, children, footer }) {
  const titleId = useId();
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-pitch-dark/65 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-7" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-paper shadow-2xl sm:max-h-[90dvh]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line bg-white/85 px-4 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-fairway">{eyebrow}</p>
            <h2 id={titleId} className="mt-1 break-words font-serif text-2xl text-pitch sm:text-3xl">{title}</h2>
          </div>
          <button ref={closeRef} type="button" className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-line px-4 py-2 text-sm font-medium text-pitch transition hover:bg-cream" onClick={onClose} aria-label="Close student details">Close</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-7 sm:py-6">{children}</div>
        {footer ? <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-white/85 px-4 py-4 sm:px-7">{footer}</footer> : null}
      </section>
    </div>,
    document.body,
  );
}

export function StudentDetailGrid({ fields }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {fields.map(([label, value]) => (
        <div key={label} className="min-w-0 rounded-2xl border border-line/80 bg-white px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink/55">{label}</dt>
          <dd className="mt-1 break-words text-sm leading-6 text-pitch">{value || "Not provided"}</dd>
        </div>
      ))}
    </dl>
  );
}
