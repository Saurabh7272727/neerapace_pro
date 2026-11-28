import DOMPurify from "dompurify";
import { useEffect, useState } from "react";

export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function PageTitle({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} · Neera Pace` : "Neera Pace Cricket Academy";
    const meta = document.querySelector('meta[name="description"]');
    if (meta && description) meta.setAttribute("content", description);
  }, [title, description]);
  return null;
}

export function Button({ variant = "primary", className, type = "button", ...props }) {
  const styles = {
    primary: "bg-pitch text-cream hover:bg-pitch-dark",
    gold: "bg-gold text-pitch-dark hover:bg-[#d4b36e]",
    ghost: "bg-transparent text-pitch hover:bg-cream",
    danger: "bg-clay text-white hover:bg-[#823c29]",
  };
  return (
    <button
      type={type}
      className={cx("inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50", styles[variant], className)}
      {...props}
    />
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-pitch">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-clay">{error}</span> : null}
    </label>
  );
}

export function PasswordInput({ className = inputClass, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative block">
      <input {...props} type={visible ? "text" : "password"} className={cx(className, "pr-16")} />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute right-1 top-1/2 inline-flex min-h-10 min-w-14 -translate-y-1/2 items-center justify-center rounded-lg px-2 text-xs font-semibold text-fairway transition hover:bg-fairway/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fairway"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </span>
  );
}

export const inputClass = "w-full rounded-xl border border-line bg-white px-3 py-2 text-ink outline-none";

export function Badge({ children, tone = "pitch" }) {
  const tones = { pitch: "bg-pitch text-cream", gold: "bg-gold/30 text-pitch", clay: "bg-clay/15 text-clay" };
  return <span className={cx("rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function Empty({ title, body }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-paper px-6 py-10 text-center">
      <h2 className="font-serif text-2xl text-pitch">{title}</h2>
      {body ? <p className="mt-2 text-sm text-ink/70">{body}</p> : null}
    </div>
  );
}

export function Spinner() {
  return <div className="grid min-h-40 place-items-center text-sm text-pitch">Loading the academy…</div>;
}

export function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-pitch-dark/55 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-3xl bg-paper p-6 shadow-xl" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-serif text-2xl text-pitch">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close">Close</Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function RichText({ html }) {
  const clean = DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "h2", "h3", "a"],
    ALLOWED_ATTR: ["href"],
  });
  return <div className="rich text-ink/85" dangerouslySetInnerHTML={{ __html: clean }} />;
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return <p className="rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">{error.message || "Something went wrong"}</p>;
}
