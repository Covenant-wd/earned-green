import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Vault, Search, ClipboardCheck, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Vault className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-primary">
              EntreVault
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </a>
            <a
              href="#advantage"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Tasks
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/register")}
              className="gradient-primary text-primary-foreground text-sm font-semibold hover:brightness-110"
            >
              Join Now
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-4 pb-20 pt-16 text-center md:pb-28 md:pt-24">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0, ease: "easeOut" }}
            className="mb-6 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary"
          >
            EntreVault Work Network
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
            className="max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl"
          >
            More Tasks. More Opportunities.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: "easeOut" }}
            className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            EntreVault brings legitimate digital tasks from multiple sources into
            one reliable worker network.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease: "easeOut" }}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              onClick={() => navigate("/register")}
              className="gradient-primary px-8 text-base font-semibold text-primary-foreground hover:brightness-110"
            >
              Join the Network
            </Button>
            <Button
              variant="link"
              onClick={() => navigate("/login")}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Sign In
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32, ease: "easeOut" }}
            className="mt-6 max-w-md text-xs leading-5 text-muted-foreground/70"
          >
            Task availability varies. Payment is based on successfully completed
            and approved work.
          </motion.p>
        </section>

        {/* How It Works */}
        <section
          id="how-it-works"
          className="border-t border-border/50 px-4 py-16 md:py-20"
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-10 text-center font-display text-2xl font-bold tracking-tight md:text-3xl">
              How It Works
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Search,
                  title: "We Source",
                  body: "We find legitimate task opportunities from multiple sources.",
                },
                {
                  icon: ClipboardCheck,
                  title: "You Work",
                  body: "Choose suitable tasks and complete them according to the requirements.",
                },
                {
                  icon: BadgeCheck,
                  title: "We Review",
                  body: "Completed work is checked before approved payment.",
                },
              ].map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-xl border border-border/60 bg-card/40 p-6 transition-colors hover:border-primary/30"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Step {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mb-2 font-display text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Advantage */}
        <section id="advantage" className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-10 text-center font-display text-2xl font-bold tracking-tight md:text-3xl">
              Volume. Reliability. Quality.
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Volume",
                  body: "Multiple sources help us bring more task opportunities to the network.",
                },
                {
                  title: "Reliable Workers",
                  body: "We are building a dependable community of workers.",
                },
                {
                  title: "Quality Control",
                  body: "We review completed work to maintain quality.",
                },
              ].map((item) => (
                <div key={item.title} className="text-center md:text-left">
                  <h3 className="mb-2 font-display text-lg font-semibold text-primary">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/50 px-4 py-16 text-center md:py-20">
          <div className="mx-auto max-w-xl">
            <h2 className="mb-3 font-display text-2xl font-bold tracking-tight md:text-3xl">
              Ready to work?
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground md:text-base">
              Join the EntreVault network and access legitimate task opportunities
              as they become available.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/register")}
              className="gradient-primary px-8 text-base font-semibold text-primary-foreground hover:brightness-110"
            >
              Join EntreVault
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Vault className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-primary">
              EntreVault
            </span>
          </div>

          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            An outsourcing network for digital task opportunities.
          </p>

          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">
              About
            </a>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Contact
            </a>
          </div>

          <p className="mt-8 text-xs text-muted-foreground/60">
            © 2026 EntreVault
          </p>
        </div>
      </footer>
    </div>
  );
}
