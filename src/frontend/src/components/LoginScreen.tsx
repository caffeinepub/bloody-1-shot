import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crosshair, LogIn } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface LoginScreenProps {
  isLoggedIn: boolean;
  isLoggingIn: boolean;
  isInitializing: boolean;
  onLogin: () => void;
  onSetName: (name: string) => void;
  savedName?: string;
}

export default function LoginScreen({
  isLoggedIn,
  isLoggingIn,
  isInitializing,
  onLogin,
  onSetName,
  savedName = "",
}: LoginScreenProps) {
  const [name, setName] = useState(savedName);
  const [nameError, setNameError] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || name.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      return;
    }
    if (name.trim().length > 20) {
      setNameError("Name too long (max 20)");
      return;
    }
    setNameError("");
    onSetName(name.trim());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 grain-overlay overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-red-team/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-team/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Crosshair
                className="w-16 h-16 text-red-team opacity-80"
                strokeWidth={1.5}
              />
              <div className="absolute inset-0 blur-lg bg-red-team/30 rounded-full" />
            </div>
          </div>
          <h1 className="font-display font-extrabold text-6xl tracking-tighter leading-none">
            <span className="text-red-team block">BLOODY</span>
            <span className="text-foreground block">1 SHOT</span>
          </h1>
          <p className="mt-3 text-muted-foreground text-sm tracking-widest uppercase font-mono">
            Desert Sniper Warfare
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 grid grid-cols-3 gap-2 text-center"
        >
          {[
            { icon: "⚡", label: "One Shot Kill" },
            { icon: "👥", label: "Team Battle" },
            { icon: "💰", label: "10 Coins/Kill" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="bg-card/60 border border-border rounded-lg py-2 px-1"
            >
              <div className="text-xl">{icon}</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                {label}
              </div>
            </div>
          ))}
        </motion.div>

        {isInitializing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-8"
          >
            <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </motion.div>
        ) : !isLoggedIn ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-muted-foreground text-sm mb-4">
              Sign in to join the battlefield
            </p>
            <Button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="w-full font-display font-bold uppercase tracking-widest bg-primary/80 hover:bg-primary text-primary-foreground h-12 text-base"
              data-ocid="lobby.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In to Play
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <p className="text-muted-foreground text-sm mb-2">
              Choose your callsign, soldier
            </p>
            <Input
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              maxLength={20}
              className="bg-card border-border text-foreground text-center text-lg font-bold h-12 placeholder:text-muted-foreground tracking-wider"
              data-ocid="lobby.player_name_input"
              autoFocus
            />
            {nameError && (
              <p
                className="text-red-team text-xs"
                data-ocid="lobby.error_state"
              >
                {nameError}
              </p>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="w-full font-display font-bold uppercase tracking-widest bg-red-team/80 hover:bg-red-team text-white h-12 text-base"
              data-ocid="lobby.submit_button"
            >
              ENTER BATTLEFIELD
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-4 text-center"
      >
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </motion.footer>
    </div>
  );
}
