import { useState } from "react";

const actionClass = "inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-pitch transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50";

export function StudentContactActions({ student }) {
  const [copyMessage, setCopyMessage] = useState("");
  const phone = String(student.phone || "");
  const phoneDigits = phone.replace(/\D/g, "");
  const email = String(student.email || "");

  async function copyContacts() {
    if (!navigator.clipboard?.writeText) {
      setCopyMessage("Clipboard access is unavailable. Copy the email and phone manually.");
      return;
    }

    try {
      await navigator.clipboard.writeText(`Email: ${email || "Not provided"}\nPhone: ${phone || "Not provided"}`);
      setCopyMessage("Email and phone copied.");
    } catch {
      setCopyMessage("Could not copy. Check clipboard permissions or copy the details manually.");
    }
  }

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-3">
        {phoneDigits ? (
          <a className={actionClass} href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer">WhatsApp</a>
        ) : (
          <button className={actionClass} type="button" disabled>WhatsApp unavailable</button>
        )}
        {email ? (
          <a className={actionClass} href={`mailto:${email}`}>Email</a>
        ) : (
          <button className={actionClass} type="button" disabled>Email unavailable</button>
        )}
        <button className={actionClass} type="button" onClick={copyContacts}>Copy email + phone</button>
      </div>
      {copyMessage ? <p className="mt-2 text-sm text-ink/70" role="status">{copyMessage}</p> : null}
    </div>
  );
}
