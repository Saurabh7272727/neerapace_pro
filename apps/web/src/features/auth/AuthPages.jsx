import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { forgotSchema, loginSchema, registerSchema, resetSchema, verifyOtpSchema } from "@neerapace/shared";
import { Button, ErrorNote, Field, PageTitle, inputClass } from "../../components/ui.jsx";
import { api, fieldErrors } from "../../lib/api.js";
import { homeForRole } from "../../lib/access.js";
import { useQuery } from "@tanstack/react-query";

function AuthShell({ title, description, children, sideTitle = "Train with purpose.", sideText = "Admissions, squads, attendance and academy communication in one secure place." }) {
  return (
    <section className="auth-shell min-h-[calc(100vh-72px)] px-4 py-10 md:py-16">
      <PageTitle title={title} description={description} />
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-4xl border border-line/80 bg-paper/95 lg:min-h-155 lg:grid-cols-[.78fr_1.22fr]">
        <aside className="hero-grid hidden min-h-155 flex-col justify-between p-9 text-cream lg:flex">
          <div><span className="grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-gold/10 font-serif text-gold">NP</span></div>
          <div><p className="text-xs uppercase tracking-[0.24em] text-gold">Neera Pace</p><h2 className="mt-4 font-serif text-5xl leading-tight">{sideTitle}</h2><p className="mt-5 max-w-sm text-sm leading-7 text-cream/70">{sideText}</p></div>
          <p className="text-xs text-cream/45">Secure academy access</p>
        </aside>
        <div className="auth-panel p-6 md:p-10 lg:p-12">
          <h1 className="font-serif text-4xl text-pitch">{title}</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-ink/65">{description}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  async function onSubmit(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.post("/auth/login", parsed.data);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate(homeForRole(result.user.role));
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <AuthShell title="Sign in" description="Players, coaches and the office use the same door.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Email" error={errors.email}><input className={inputClass} name="email" type="email" autoComplete="username" /></Field>
        <Field label="Password" error={errors.password}><input className={inputClass} name="password" type="password" autoComplete="current-password" /></Field>
        <ErrorNote error={error} />
        {error?.code === "EMAIL_UNVERIFIED" ? <Link className="text-sm text-fairway" to="/verify">Enter your email code</Link> : null}
        <Button type="submit">Sign in</Button>
        <p className="text-sm"><Link to="/forgot">Forgot password</Link> · <Link to="/register">New player</Link></p>
      </form>
      <GoogleSignIn onSuccess={async (user) => { await queryClient.invalidateQueries({ queryKey: ["me"] }); navigate(homeForRole(user.role)); }} onError={setError} />
    </AuthShell>
  );
}

export function RegisterPage() {
  const programs = useQuery({ queryKey: ["programs"], queryFn: () => api.get("/programs") });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  async function onSubmit(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.post("/auth/register", parsed.data);
      setDone(result);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }
  if (done) {
    return (
      <AuthShell title="Check your email" description={`Registration ID ${done.registrationId}`}>
        <p className="text-sm">We sent a 6-digit code to {done.email}. The application stays pending until you confirm the address and the office approves it.</p>
        <Link className="mt-4 inline-block text-fairway" to={`/verify?email=${encodeURIComponent(done.email)}`}>Enter the code</Link>
      </AuthShell>
    );
  }
  const fields = [
    ["name", "Player name"],
    ["email", "Email", "email"],
    ["phone", "Phone"],
    ["password", "Password", "password"],
    ["dateOfBirth", "Date of birth", "date"],
    ["address", "Address"],
    ["guardianName", "Guardian name"],
    ["guardianPhone", "Guardian phone"],
    ["guardianEmail", "Guardian email", "email"],
  ];
  return (
    <AuthShell title="Register a player" description="No online payment. The office confirms the place after email verification.">
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        {fields.map(([name, label, type]) => (
          <Field key={name} label={label} error={errors[name]}>
            <input className={inputClass} name={name} type={type || "text"} />
          </Field>
        ))}
        <Field label="Gender" error={errors.gender}>
          <select className={inputClass} name="gender" defaultValue="">
            <option value="" disabled>Choose</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Program" error={errors.programId}>
          <select className={inputClass} name="programId" defaultValue="">
            <option value="" disabled>Choose a program</option>
            {(programs.data || []).map((program) => <option key={program.id} value={program.id}>{program.name} · {program.ageGroup}</option>)}
          </select>
        </Field>
        <ErrorNote error={error} />
        <Button type="submit" loading={submitting}>Submit application</Button>
      </form>
      <GoogleSignIn onSuccess={async (user) => { await queryClient.invalidateQueries({ queryKey: ["me"] }); navigate(homeForRole(user.role)); }} onError={setError} />
    </AuthShell>
  );
}

export function VerifyPage() {
  const [params] = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  async function onSubmit(event) {
    event.preventDefault();
    const payload = { ...Object.fromEntries(new FormData(event.currentTarget).entries()), purpose: "verify" };
    const parsed = verifyOtpSchema.safeParse(payload);
    if (!parsed.success) return setError({ message: "Enter the email and the 6-digit code." });
    try {
      const result = await api.post("/auth/verify-otp", parsed.data);
      setMessage(result.status === "pending_approval" ? "Email confirmed. The office will review the application." : "Email confirmed.");
      setError(null);
    } catch (err) {
      setError(err);
    }
  }
  return (
    <AuthShell title="Confirm your email" description="The code expires in 10 minutes.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Email"><input className={inputClass} name="email" defaultValue={params.get("email") || ""} /></Field>
        <Field label="Code"><input className={inputClass} name="otp" inputMode="numeric" autoComplete="one-time-code" /></Field>
        <ErrorNote error={error} />
        {message ? <p className="text-sm text-fairway">{message} <Link to="/login">Sign in</Link></p> : null}
        <Button type="submit">Verify</Button>
      </form>
    </AuthShell>
  );
}

export function ForgotPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  async function onSubmit(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const parsed = forgotSchema.safeParse(payload);
    if (!parsed.success) return setError({ message: "Enter a valid email." });
    try {
      await api.post("/auth/forgot-password", parsed.data);
      setSent(true);
    } catch (err) {
      setError(err);
    }
  }
  return (
    <AuthShell title="Reset password" description="If the account can sign in, we email a code.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Email"><input className={inputClass} name="email" type="email" /></Field>
        <ErrorNote error={error} />
        {sent ? <p className="text-sm text-fairway">If that inbox is registered, the code is on its way. <Link to="/reset">Enter it here</Link>.</p> : null}
        <Button type="submit">Send code</Button>
      </form>
    </AuthShell>
  );
}

export function ResetPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  async function onSubmit(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const parsed = resetSchema.safeParse(payload);
    if (!parsed.success) return setError({ message: fieldErrors(parsed.error).password || "Check the email, code and new password." });
    try {
      await api.post("/auth/reset-password", parsed.data);
      setDone(true);
    } catch (err) {
      setError(err);
    }
  }
  return (
    <AuthShell title="Choose a new password" description="Use the code from the reset email.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Email"><input className={inputClass} name="email" type="email" /></Field>
        <Field label="Code"><input className={inputClass} name="otp" /></Field>
        <Field label="New password"><input className={inputClass} name="password" type="password" /></Field>
        <ErrorNote error={error} />
        {done ? <p className="text-sm text-fairway"><Link to="/login">Password updated. Sign in.</Link></p> : null}
        <Button type="submit">Update password</Button>
      </form>
    </AuthShell>
  );
}

function GoogleSignIn({ onSuccess, onError }) {
  const config = useQuery({ queryKey: ["google-sso-config"], queryFn: () => api.get("/auth/google/config") });

  useEffect(() => {
    if (!config.data?.enabled || !config.data?.clientId) return;
    const scriptId = "google-identity-services";
    const render = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: config.data.clientId,
        callback: async ({ credential }) => {
          try {
            const result = await api.post("/auth/google", { credential });
            onSuccess(result.user);
          } catch (error) {
            onError(error);
          }
        },
        ux_mode: "popup",
        auto_select: false,
      });
      window.google.accounts.id.renderButton(document.getElementById("google-sso-button"), {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 320,
      });
    };
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener("load", render, { once: true });
      render();
      return;
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);
  }, [config.data]);

  if (!config.data?.enabled) return <p className="rounded-xl border border-line bg-white px-4 py-3 text-xs text-ink/55">Google sign-in is awaiting administrator configuration.</p>;
  return <div id="google-sso-button" className="min-h-11" />;
}
