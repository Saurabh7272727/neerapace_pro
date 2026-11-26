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
  const [searchParams] = useSearchParams();
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const googleError = searchParams.get("google_error");

  useEffect(() => {
    if (!googleError) return;
    const messages = {
      cancelled: "Google sign-in was cancelled.",
      state: "Google sign-in could not verify this request. Please try again.",
      failed: "Google sign-in failed. Check your account and try again.",
    };
    setError({ message: messages[googleError] || messages.failed });
  }, [googleError]);
  async function onSubmit(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setError(null);
      return;
    }
    setErrors({});
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.post("/auth/login", parsed.data);
      await queryClient.cancelQueries({ queryKey: ["me"] });
      let session;
      try {
        session = await api.get("/auth/me");
      } catch (sessionError) {
        if (sessionError.status === 401) {
          throw new Error("Your credentials were accepted, but this browser did not keep the sign-in session. Use the HTTPS site, or set COOKIE_SECURE=false for local HTTP development.");
        }
        throw sessionError;
      }
      queryClient.setQueryData(["me"], session);
      navigate(homeForRole(session.role || result.user.role));
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
        <Button type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</Button>
        <p className="text-sm"><Link to="/forgot">Forgot password</Link> · <Link to="/register">New player</Link></p>
      </form>
      <GoogleSignIn />
    </AuthShell>
  );
}

export function RegisterPage() {
  const programs = useQuery({ queryKey: ["programs"], queryFn: () => api.get("/programs") });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  async function onSubmit(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setError(null);
      return;
    }
    setErrors({});
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
      <AuthShell
        title="Application received"
        description={`Your reference number is ${done.registrationId}. Keep it handy when contacting the academy.`}
        sideTitle="A strong start to your cricket journey."
        sideText="One quick step remains: confirm your email so the academy team can review your application."
      >
        <div className="rounded-3xl border border-line bg-white p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-fairway/10 text-2xl font-semibold text-fairway" aria-hidden="true">✓</span>
            <div>
              <p className="font-semibold text-pitch">Check your inbox</p>
              <p className="mt-1 text-sm leading-6 text-ink/70">We sent a confirmation code to <strong className="break-all">{done.email}</strong>. Verify the address before the office reviews your application.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
            {["Application sent", "Verify your email", "Office review"].map((step, index) => (
              <div key={step} className="flex items-center gap-2 text-xs text-ink/65">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-semibold ${index === 0 ? "bg-fairway text-white" : "bg-cream text-ink/55"}`}>{index === 0 ? "✓" : index + 1}</span>
                {step}
              </div>
            ))}
          </div>
          <Link className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-pitch px-5 py-3 text-sm font-semibold text-cream transition hover:bg-pitch-dark" to={`/verify?email=${encodeURIComponent(done.email)}`}>
            Verify email address
          </Link>
        </div>
        <p className="mt-5 text-center text-sm text-ink/65">Already confirmed? <Link className="font-medium text-fairway" to="/login">Sign in</Link></p>
      </AuthShell>
    );
  }
  const selectedProgram = programs.data?.find((program) => program.id === selectedProgramId);
  const canSubmit = !submitting && !programs.isLoading && Boolean(programs.data?.length);
  return (
    <AuthShell
      title="Join the academy"
      description="Tell us about the player and we’ll help find a fitting training pathway. There’s no online payment."
      sideTitle="Your next innings start here."
      sideText="Share a few details with the academy team. After email confirmation, the office can review your application and follow up about next steps."
    >
      <div className="mb-6 rounded-2xl border border-line bg-cream/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fairway">Player application</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["Your details", "Email check", "Office review"].map((step, index) => (
            <div key={step} className="flex items-center gap-2 text-[11px] font-medium text-ink/65 sm:text-xs">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-fairway shadow-sm">{index + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <fieldset className="rounded-3xl border border-line bg-white/80 p-4 sm:p-5">
          <legend className="px-2 font-serif text-xl text-pitch">Player account</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Player name" error={errors.name}><input className={inputClass} name="name" autoComplete="name" placeholder="Full name" /></Field>
            <Field label="Email address" error={errors.email}><input className={inputClass} name="email" type="email" autoComplete="email" placeholder="you@example.com" /></Field>
            <Field label="Phone number" error={errors.phone}><input className={inputClass} name="phone" type="tel" autoComplete="tel" placeholder="Include country code if needed" /></Field>
            <Field label="Create password" error={errors.password}>
              <input className={inputClass} name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" />
              <span className="mt-1 block text-xs text-ink/50">Use at least 8 characters with a letter and a number.</span>
            </Field>
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-line bg-white/80 p-4 sm:p-5">
          <legend className="px-2 font-serif text-xl text-pitch">Player details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date of birth" error={errors.dateOfBirth}><input className={inputClass} name="dateOfBirth" type="date" autoComplete="bday" /></Field>
            <Field label="Gender" error={errors.gender}>
              <select className={inputClass} name="gender" defaultValue="">
                <option value="" disabled>Select an option</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Prefer to self-describe / not listed</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Home address" error={errors.address}><textarea className={`${inputClass} min-h-24 resize-y`} name="address" autoComplete="street-address" rows={3} placeholder="Street, area, city" /></Field>
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-line bg-white/80 p-4 sm:p-5">
          <legend className="px-2 font-serif text-xl text-pitch">Parent or guardian</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Guardian name" error={errors.guardianName}><input className={inputClass} name="guardianName" autoComplete="name" placeholder="Full name" /></Field>
            <Field label="Guardian phone" error={errors.guardianPhone}><input className={inputClass} name="guardianPhone" type="tel" autoComplete="tel" placeholder="Contact number" /></Field>
            <div className="sm:col-span-2">
              <Field label="Guardian email (optional)" error={errors.guardianEmail}><input className={inputClass} name="guardianEmail" type="email" autoComplete="email" placeholder="guardian@example.com" /></Field>
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-line bg-white/80 p-4 sm:p-5">
          <legend className="px-2 font-serif text-xl text-pitch">Training pathway</legend>
          <Field label="Choose a program" error={errors.programId}>
            <select className={inputClass} name="programId" value={selectedProgramId} onChange={(event) => setSelectedProgramId(event.target.value)} disabled={programs.isLoading || !programs.data?.length}>
              <option value="">{programs.isLoading ? "Loading programs..." : "Select a program"}</option>
              {(programs.data || []).map((program) => <option key={program.id} value={program.id}>{program.name} · {program.ageGroup}</option>)}
            </select>
          </Field>
          {selectedProgram ? <p className="mt-3 rounded-xl bg-cream/70 px-3 py-2 text-sm leading-6 text-ink/70">{selectedProgram.description}{selectedProgram.scheduleSummary ? ` Schedule: ${selectedProgram.scheduleSummary}` : ""}</p> : null}
          {!programs.isLoading && !programs.error && !programs.data?.length ? <p className="mt-2 text-sm text-clay">There are no published programs available for registration right now. Please contact the academy.</p> : null}
          <ErrorNote error={programs.error} />
        </fieldset>

        <ErrorNote error={error} />
        <Button type="submit" disabled={!canSubmit} className="w-full py-3 text-base">
          {submitting ? "Sending application..." : "Submit player application"}
        </Button>
        <p className="text-center text-xs leading-5 text-ink/55">You’ll receive an email verification code. The office reviews applications after the email is confirmed.</p>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-ink/40"><span className="h-px flex-1 bg-line" />or continue with<span className="h-px flex-1 bg-line" /></div>
      <GoogleSignIn />
      <p className="mt-5 text-center text-sm text-ink/65">Already have an account? <Link className="font-medium text-fairway" to="/login">Sign in</Link></p>
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

function GoogleSignIn() {
  const config = useQuery({ queryKey: ["google-sso-config"], queryFn: () => api.get("/auth/google/config") });
  if (!config.data?.enabled) return <p className="rounded-xl border border-line bg-white px-4 py-3 text-xs text-ink/55">Google sign-in is awaiting administrator configuration.</p>;
  return (
    <a href="/api/auth/google/start" className="mt-4 flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-cream">
      <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full border border-line font-bold text-blue-600">G</span>
      Continue with Google
    </a>
  );
}
