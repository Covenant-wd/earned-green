import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Vault, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DownloadAppButton } from "@/components/DownloadAppButton";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    referralCode: refCode,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.endsWith("@gmail.com")) {
      toast.error("Only @gmail.com emails are accepted");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const result = await register({
      email: form.email,
      password: form.password,
      username: form.username,
      firstName: form.firstName,
      lastName: form.lastName,
      referralCode: form.referralCode,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Registration submitted! Awaiting admin approval.");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <ThemeToggle className="absolute right-4 top-4 text-muted-foreground hover:text-foreground" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary mb-4">
            <Vault className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold gradient-text">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join EntreVault and start earning</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="bg-background" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="bg-background" required />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="username" value={form.username} onChange={(e) => update("username", e.target.value)} className="pl-10 bg-background" required />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="reg-email">Email (@gmail.com only)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="reg-email" type="email" placeholder="you@gmail.com" value={form.email} onChange={(e) => update("email", e.target.value)} className="pl-10 bg-background" required />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="reg-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="reg-password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} className="pl-10 pr-10 bg-background" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input id="confirm-password" type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className="bg-background" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="referral">Referral Code (optional)</Label>
            <Input id="referral" value={form.referralCode} onChange={(e) => update("referralCode", e.target.value)} className="bg-background font-mono text-sm" placeholder="Enter referral code" />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">Sign In</Link>
        </div>

        <div className="mt-5 pt-5 border-t border-border">
          <DownloadAppButton />
        </div>
      </motion.div>
    </div>
  );
}
