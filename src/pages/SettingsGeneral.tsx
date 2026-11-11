import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SettingsLayout from "@/components/settings/SettingsLayout";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { MAX_PHOTO_BYTES, resizeImageToSquare } from "@/lib/media";

export default function SettingsGeneral() {
  const { user, profile, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setCompanyName(profile.company_name ?? "");
    setAvatarUrl(profile.avatar_url ?? null);
  }, [profile]);

  const dirty =
    !!profile && (fullName.trim() !== (profile.full_name ?? "").trim() || companyName.trim() !== (profile.company_name ?? "").trim());

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("That file is not an image. Choose a JPG or PNG.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("That image is larger than 8 MB. Choose a smaller one.");
      return;
    }
    setIsUploading(true);
    try {
      const photo = await resizeImageToSquare(file, 320);
      const path = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, photo, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      // The path never changes, so the address needs a new suffix for browsers to load the new photo.
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const { error } = await updateProfile({ avatar_url: url });
      if (error) throw error;
      setAvatarUrl(url);
      toast.success("Photo updated");
    } catch (err) {
      console.error("Photo upload failed:", err);
      toast.error("The photo did not upload. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!dirty || isSaving) return;
    setIsSaving(true);
    const { error } = await updateProfile({ full_name: fullName.trim(), company_name: companyName.trim() });
    setIsSaving(false);
    if (error) toast.error("Your changes did not save. Try again.");
    else toast.success("Saved");
  };

  const sendPasswordLink = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/login` });
    setSendingReset(false);
    if (error) toast.error("The email did not send. Wait a minute, then try again.");
    else toast.success(`Check ${user.email} for a link to set a new password.`);
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <form onSubmit={save} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">Your details</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your business name appears on your collection forms and in the permission text clients agree to.</p>

          <div className="mt-6 flex items-center gap-4">
            <PersonAvatar name={fullName || user?.email} src={avatarUrl} size="xl" />
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={uploadPhoto} aria-label="Upload a profile photo" />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                {avatarUrl ? "Change photo" : "Add a photo"}
              </Button>
              <p className="mt-1.5 text-xs text-muted-foreground">JPG or PNG, up to 8 MB.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="full-name">Your name</Label>
              <Input id="full-name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="company-name">Business name</Label>
              <Input
                id="company-name"
                autoComplete="organization"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                maxLength={120}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={!dirty || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">Sign-in</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div>
                <p className="text-sm font-medium text-foreground">Password</p>
                <p className="text-sm text-muted-foreground">We email you a link to set a new one.</p>
              </div>
              <Button variant="outline" onClick={sendPasswordLink} disabled={sendingReset}>
                {sendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Email me a link
              </Button>
            </div>
          </div>
        </section>
      </div>
    </SettingsLayout>
  );
}
