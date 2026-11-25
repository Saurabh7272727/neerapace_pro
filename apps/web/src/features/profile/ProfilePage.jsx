import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, ErrorNote, Field, PageTitle, inputClass } from "../../components/ui.jsx";
import { useSession } from "../../hooks/useSession.js";
import { api, imageUrl } from "../../lib/api.js";

export function ProfilePage() {
  const session = useSession();
  const queryClient = useQueryClient();
  const user = session.data;
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  if (!user) return null;

  async function save(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (payload.experienceYears) payload.experienceYears = Number(payload.experienceYears);
    if (user.role === "coach") payload.isPublic = event.currentTarget.isPublic.checked;
    Object.keys(payload).forEach((key) => { if (payload[key] === "") delete payload[key]; });
    try {
      await api.patch("/auth/me", payload);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setSaved(true);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await api.upload("avatars", file);
      await api.patch("/auth/me", { avatarUrl: uploaded.url, avatarPublicId: uploaded.publicId });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    } catch (err) {
      setError(err);
    }
  }

  return (
    <section className="max-w-xl">
      <PageTitle title="Profile" />
      <h1 className="font-serif text-4xl text-pitch">Profile</h1>
      {user.avatarUrl ? <img src={imageUrl(user.avatarUrl, 160)} alt="" className="mt-4 h-16 w-16 rounded-full object-cover" /> : null}
      <label className="mt-3 block text-sm">Profile photo
        <input className="mt-1 block" type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} />
      </label>
      <form className="mt-6 grid gap-3" onSubmit={save}>
        <Field label="Name"><input className={inputClass} name="name" defaultValue={user.name} /></Field>
        <Field label="Phone"><input className={inputClass} name="phone" defaultValue={user.phone} /></Field>
        {user.role === "student" ? (
          <>
            <Field label="Address"><input className={inputClass} name="address" defaultValue={user.profile?.address || ""} /></Field>
            <Field label="Guardian phone"><input className={inputClass} name="guardianPhone" defaultValue={user.profile?.guardianPhone || ""} /></Field>
          </>
        ) : null}
        {user.role === "coach" ? (
          <>
            <Field label="Specialisation"><input className={inputClass} name="specialization" defaultValue={user.profile?.specialization || ""} /></Field>
            <Field label="Bio"><textarea className={inputClass} name="bio" rows={4} defaultValue={user.profile?.bio || ""} /></Field>
            <Field label="Years coaching"><input className={inputClass} name="experienceYears" type="number" defaultValue={user.profile?.experienceYears || 0} /></Field>
            <label className="text-sm"><input name="isPublic" type="checkbox" defaultChecked={user.profile?.isPublic} /> Show my profile on the website</label>
          </>
        ) : null}
        <ErrorNote error={error} />
        {saved ? <p className="text-sm text-fairway">Saved.</p> : null}
        <Button type="submit">Save profile</Button>
      </form>
    </section>
  );
}
