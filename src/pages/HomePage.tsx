import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Vault,
  ArrowRight,
  CheckCircle2,
  Zap,
  Users,
  ShieldCheck,
  TrendingUp,
  ListChecks,
  Wallet,
  ChevronDown,
  Star,
  Globe,
  Lock,
} from "lucide-react";

/* ─── tiny hook: animate numbers counting up ─── */
function useCountUp(target: number, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return val;
}

/* ─── step data ─── */
const steps = [
  {
    n: "01",
    title: "Create your account",
    body: "Sign up in minutes. Enter your details, get your unique referral code, and join the EntreVault community.",
    icon: ShieldCheck,
  },
  {
    n: "02",
    title: "Activate your account",
    body: "Complete a one-time registration payment to unlock your dashboard, courses, and earning opportunities.",
    icon: Lock,
  },
  {
    n: "03",
    title: "Learn TikTok creation",
    body: "Access step-by-step courses and guides on TikTok content creation — from scripting to going viral.",
    icon: ListChecks,
  },
  {
    n: "04",
    title: "Complete tasks & earn",
    body: "Apply what you learn by completing mini tasks. Submit proof, get reviewed, and earn USDT rewards.",
    icon: Wallet,
  },
];

const features = [
  {
    icon: Zap,
    title: "Video courses & lessons",
    body: "Structured TikTok courses with video tutorials, from beginner basics to advanced growth strategies.",
  },
  {
    icon: Users,
    title: "Referral income",
    body: "Share your unique code. Every person you refer who activates an account puts a bonus straight into your wallet.",
  },
  {
    icon: TrendingUp,
    title: "Earn while you learn",
    body: "Complete mini tasks — from social engagements to content creation — and get paid in USDT for every approved submission.",
  },
  {
    icon: Globe,
    title: "Tips & guides library",
    body: "Browse a growing library of TikTok tips, trends, and creator guides written by successful content creators.",
  },
  {
    icon: ShieldCheck,
    title: "Verified payouts",
    body: "Withdrawals are reviewed and processed by our team, ensuring every payout is legitimate and securely handled.",
  },
  {
    icon: Star,
    title: "Growing community",
    body: "Join a network of creators and earners. Learn together, grow together, and build your TikTok presence.",
  },
];

const testimonials = [
  {
    name: "Amara O.",
    handle: "@amara_earns",
    text: "I withdrew my first $40 after just two weeks. The tasks are straightforward and the referral bonus from my friends added up quickly.",
    stars: 5,
  },
  {
    name: "Kelechi M.",
    handle: "@kelechi_m",
    text: "EntreVault is the most transparent earn platform I've used. I can see every transaction and there are no hidden deductions.",
    stars: 5,
  },
  {
    name: "Fatima B.",
    handle: "@fatimab_ng",
    text: "Got three friends to sign up using my referral code. The bonuses hit my wallet the same day they were approved. Love it.",
    stars: 5,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const users = useCountUp(12400, 2000, statsVisible);
  const paid = useCountUp(98600, 2200, statsVisible);
  const tasks = useCountUp(340, 1600, statsVisible);

  return (
    <div
      style={{
        background: "hsl(220 20% 6%)",
        color: "hsl(0 0% 95%)",
        fontFamily: "'Inter', sans-serif",
        overflowX: "hidden",
        minHeight: "100vh",
      }}
    >
      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ev-btn-primary {
          background: linear-gradient(135deg, hsl(160 84% 39%), hsl(160 84% 50%));
          color: hsl(220 20% 6%);
          border: none;
          border-radius: 10px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .ev-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 30px hsl(160 84% 39% / 0.4);
          filter: brightness(1.08);
        }

        .ev-btn-outline {
          background: transparent;
          color: hsl(0 0% 90%);
          border: 1px solid hsl(220 16% 28%);
          border-radius: 10px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 500;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .ev-btn-outline:hover {
          border-color: hsl(160 84% 39% / 0.5);
          color: hsl(160 84% 55%);
          transform: translateY(-1px);
        }

        .glass {
          background: hsla(220, 18%, 10%, 0.6);
          border: 1px solid hsla(220, 16%, 25%, 0.3);
          backdrop-filter: blur(16px);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.37);
        }

        .glass-hover {
          background: hsla(220, 18%, 10%, 0.6);
          border: 1px solid hsla(220, 16%, 25%, 0.3);
          backdrop-filter: blur(16px);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.37);
          transition: all 0.3s;
        }
        .glass-hover:hover {
          border-color: hsl(160 84% 39% / 0.3);
          box-shadow: 0 8px 32px rgba(0,0,0,0.37), 0 0 20px hsl(160 84% 39% / 0.1);
          transform: translateY(-3px);
        }

        .glow { color: hsl(160 84% 45%); text-shadow: 0 0 20px hsl(160 84% 39% / 0.4); }
        .gradient-text {
          background: linear-gradient(135deg, hsl(160 84% 50%), hsl(160 60% 70%));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-20px) scale(1.04); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(6px); }
        }

        .anim-fade-up-1 { animation: fadeUp 0.7s ease both 0.1s; }
        .anim-fade-up-2 { animation: fadeUp 0.7s ease both 0.25s; }
        .anim-fade-up-3 { animation: fadeUp 0.7s ease both 0.4s; }
        .anim-fade-up-4 { animation: fadeUp 0.7s ease both 0.55s; }
        .anim-fade-in   { animation: fadeIn 1s ease both 0.2s; }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .orb-green {
          width: 520px; height: 520px;
          background: radial-gradient(circle, hsl(160 84% 39% / 0.18), transparent 70%);
          animation: floatOrb 8s ease-in-out infinite;
        }
        .orb-blue {
          width: 380px; height: 380px;
          background: radial-gradient(circle, hsl(220 80% 50% / 0.1), transparent 70%);
          animation: floatOrb 10s ease-in-out infinite reverse;
        }

        .scroll-hint { animation: scrollBounce 1.8s ease-in-out infinite; }

        .stat-number {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          font-size: 2.6rem;
          color: hsl(160 84% 45%);
          text-shadow: 0 0 20px hsl(160 84% 39% / 0.4);
          line-height: 1;
        }

        .step-number {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          font-weight: 600;
          color: hsl(160 84% 45%);
          letter-spacing: 0.08em;
        }

        .star { color: hsl(38 92% 50%); font-size: 0.85rem; }

        .nav-link {
          color: hsl(0 0% 70%);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s;
        }
        .nav-link:hover { color: hsl(160 84% 50%); }

        .divider-line {
          border: none;
          border-top: 1px solid hsla(220, 16%, 25%, 0.3);
        }

        .grid-dots {
          background-image: radial-gradient(circle, hsla(220, 16%, 40%, 0.25) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 2.6rem !important; }
          .hero-subtitle { font-size: 1rem !important; }
          .stat-number { font-size: 2rem !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
          .hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .hero-btns button { justify-content: center !important; }
          .nav-links { display: none !important; }
          .cta-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "hsla(220, 20%, 6%, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid hsla(220, 16%, 25%, 0.25)",
        padding: "0 2rem",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, hsl(160 84% 39%), hsl(160 84% 50%))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Vault size={18} color="hsl(220 20% 6%)" />
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.15rem", color: "hsl(160 84% 50%)", textShadow: "0 0 20px hsl(160 84% 39% / 0.4)" }}>
            EntreVault
          </span>
        </div>

        {/* Nav links */}
        <div className="nav-links" style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#testimonials" className="nav-link">Reviews</a>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="ev-btn-outline" style={{ padding: "8px 18px" }} onClick={() => navigate("/login")}>
            Sign in
          </button>
          <button className="ev-btn-primary" style={{ padding: "8px 18px" }} onClick={() => navigate("/register")}>
            Get started
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "92vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6rem 2rem 4rem" }}>
        {/* Background grid + orbs */}
        <div className="grid-dots" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
        <div className="orb orb-green" style={{ top: "-80px", left: "50%", transform: "translateX(-50%)" }} />
        <div className="orb orb-blue" style={{ bottom: "10%", right: "-100px" }} />

        {/* Badge */}
        <div className="anim-fade-up-1" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "hsl(160 84% 39% / 0.12)",
          border: "1px solid hsl(160 84% 39% / 0.3)",
          borderRadius: "100px", padding: "6px 16px",
          marginBottom: "2rem",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "hsl(160 84% 45%)", display: "inline-block", boxShadow: "0 0 8px hsl(160 84% 39%)", animation: "pulseGlow 2s ease-in-out infinite" }} />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.8rem", fontWeight: 500, color: "hsl(160 84% 55%)" }}>
            Learn TikTok · Earn USDT · Grow your audience
          </span>
        </div>

        {/* Headline */}
        <h1 className="hero-title anim-fade-up-2" style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 800,
          fontSize: "clamp(2.8rem, 7vw, 5rem)",
          lineHeight: 1.08,
          textAlign: "center",
          maxWidth: "820px",
          letterSpacing: "-0.02em",
          marginBottom: "1.5rem",
        }}>
          Learn TikTok.
          <br />
          <span className="gradient-text">Earn rewards.</span>
          <br />
          Build your brand.
        </h1>

        {/* Subheading */}
        <p className="hero-subtitle anim-fade-up-3" style={{
          fontSize: "1.15rem",
          color: "hsl(220 10% 62%)",
          textAlign: "center",
          maxWidth: "560px",
          lineHeight: 1.7,
          marginBottom: "2.5rem",
          fontWeight: 400,
        }}>
          EntreVault teaches you TikTok content creation through structured courses and video tutorials — while you earn USDT by completing mini tasks and growing your referral network.
        </p>

        {/* CTA buttons */}
        <div className="hero-btns anim-fade-up-4" style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", marginBottom: "4rem" }}>
          <button className="ev-btn-primary" style={{ padding: "14px 32px", fontSize: "1rem" }} onClick={() => navigate("/register")}>
            Start learning today <ArrowRight size={16} />
          </button>
          <button className="ev-btn-outline" style={{ padding: "14px 32px", fontSize: "1rem" }} onClick={() => navigate("/login")}>
            Sign in to dashboard
          </button>
        </div>

        {/* Trust row */}
        <div className="anim-fade-in" style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
          {["TikTok courses", "Task rewards", "Referral bonuses"].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: "7px", color: "hsl(220 10% 55%)", fontSize: "0.85rem" }}>
              <CheckCircle2 size={14} color="hsl(160 84% 45%)" />
              {t}
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="scroll-hint" style={{ position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)", color: "hsl(220 10% 40%)" }}>
          <ChevronDown size={22} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} style={{ padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div className="glass" style={{ padding: "3rem 2rem" }}>
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0", textAlign: "center" }}>
              {[
                { val: users, suffix: "+", label: "Active earners" },
                { val: paid, suffix: "+", label: "USDT paid out", prefix: "$" },
                { val: tasks, suffix: "+", label: "Tasks completed daily" },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: "1.5rem 1rem",
                  borderRight: i < 2 ? "1px solid hsla(220, 16%, 25%, 0.3)" : "none",
                }}>
                  <div className="stat-number">
                    {s.prefix || ""}{s.val.toLocaleString()}{s.suffix}
                  </div>
                  <div style={{ color: "hsl(220 10% 55%)", fontSize: "0.85rem", marginTop: "8px", fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "hsl(160 84% 45%)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>
              — The process —
            </p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-0.02em" }}>
              Four steps to your first payout
            </h2>
          </div>

          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            {steps.map((s, i) => (
              <div key={i} className="glass-hover" style={{ padding: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "hsl(160 84% 39% / 0.12)",
                    border: "1px solid hsl(160 84% 39% / 0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <s.icon size={20} color="hsl(160 84% 45%)" />
                  </div>
                  <span className="step-number">{s.n}</span>
                </div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "1.05rem", marginBottom: "8px" }}>
                  {s.title}
                </h3>
                <p style={{ color: "hsl(220 10% 55%)", fontSize: "0.9rem", lineHeight: 1.65 }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "5rem 2rem", position: "relative" }}>
        <div className="orb orb-green" style={{ top: "0", left: "-200px", opacity: 0.6 }} />
        <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "hsl(160 84% 45%)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>
              — Why EntreVault —
            </p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-0.02em" }}>
              Everything you need to earn smarter
            </h2>
          </div>

          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
            {features.map((f, i) => (
              <div key={i} className="glass-hover" style={{ padding: "1.75rem" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "hsl(160 84% 39% / 0.12)",
                  border: "1px solid hsl(160 84% 39% / 0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "1rem",
                }}>
                  <f.icon size={18} color="hsl(160 84% 45%)" />
                </div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "0.95rem", marginBottom: "8px" }}>
                  {f.title}
                </h3>
                <p style={{ color: "hsl(220 10% 52%)", fontSize: "0.875rem", lineHeight: 1.65 }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "hsl(160 84% 45%)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>
              — Earner reviews —
            </p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-0.02em" }}>
              Real people, real withdrawals
            </h2>
          </div>

          <div className="testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
            {testimonials.map((t, i) => (
              <div key={i} className="glass" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "3px" }}>
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <span key={si} className="star">★</span>
                  ))}
                </div>
                <p style={{ color: "hsl(0 0% 80%)", fontSize: "0.9rem", lineHeight: 1.7, flexGrow: 1 }}>
                  "{t.text}"
                </p>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "0.9rem" }}>{t.name}</div>
                  <div style={{ color: "hsl(160 84% 45%)", fontSize: "0.8rem", fontFamily: "'JetBrains Mono', monospace" }}>{t.handle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div className="glass" style={{
            padding: "4rem 3rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Subtle glow inside card */}
            <div style={{
              position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)",
              width: "400px", height: "200px",
              background: "radial-gradient(circle, hsl(160 84% 39% / 0.15), transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "linear-gradient(135deg, hsl(160 84% 39%), hsl(160 84% 50%))",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}>
              <Vault size={26} color="hsl(220 20% 6%)" />
            </div>

            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
              letterSpacing: "-0.02em",
              marginBottom: "1rem",
            }}>
              Ready to open your vault?
            </h2>
            <p style={{ color: "hsl(220 10% 58%)", fontSize: "1rem", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto 2.5rem" }}>
              Join thousands of earners who complete tasks, refer friends, and withdraw USDT directly to their MiniPay account.
            </p>

            <div className="cta-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", maxWidth: "420px", margin: "0 auto" }}>
              <button className="ev-btn-primary" style={{ padding: "14px 20px", justifyContent: "center" }} onClick={() => navigate("/register")}>
                Create account <ArrowRight size={15} />
              </button>
              <button className="ev-btn-outline" style={{ padding: "14px 20px", justifyContent: "center" }} onClick={() => navigate("/login")}>
                Sign in
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid hsla(220, 16%, 25%, 0.3)", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, hsl(160 84% 39%), hsl(160 84% 50%))",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Vault size={13} color="hsl(220 20% 6%)" />
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "hsl(160 84% 50%)" }}>EntreVault</span>
          </div>
          <p style={{ color: "hsl(220 10% 40%)", fontSize: "0.8rem" }}>
            © {new Date().getFullYear()} EntreVault. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <a href="#" className="nav-link" style={{ fontSize: "0.8rem" }}>Terms</a>
            <a href="#" className="nav-link" style={{ fontSize: "0.8rem" }}>Privacy</a>
            <a href="#" className="nav-link" style={{ fontSize: "0.8rem" }}>Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
