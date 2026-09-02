import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { COMMON_TIMEZONES } from "@/lib/format";

export default function ProfilePage() {
  const { profile, user, refresh, roles } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    phone: "",
    bio: "",
    timezone: "Africa/Lagos",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        username: profile.username ?? "",
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
        timezone: profile.timezone ?? "Africa/Lagos",
      });
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    refresh();
  };

  const zones = Array.from(new Set([form.timezone, ...COMMON_TIMEZONES]));

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader title="Profile" description="Your details and class timezone." />

      <div className="surface space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="first">First name</Label>
            <Input
              id="first"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="last">Last name</Label>
            <Input
              id="last"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile?.email ?? user?.email ?? ""} disabled />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div>
          <Label htmlFor="tz">Timezone</Label>
          <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
            <SelectTrigger id="tz">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {zones.map((z) => (
                <SelectItem key={z} value={z}>
                  {z}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">All class times are shown in this timezone.</p>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Role: <span className="capitalize">{roles.join(", ") || "student"}</span>
          </p>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
