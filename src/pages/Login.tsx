import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.jpeg";

const ALLOWED_EMAILS = ["tomas.moschen@gmail.com", "paulibrach15@outlook.com"];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError("Email o contraseña incorrectos.");
    } else {
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      setError("Este email no tiene acceso a la aplicación.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Te enviamos un email de verificación. Revisá tu bandeja de entrada para confirmar tu cuenta.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Decorative blobs */}
      <div className="fixed top-[-5rem] right-[-5rem] w-64 h-64 bg-accent/40 brand-blob opacity-50" />
      <div className="fixed bottom-[-8rem] left-[-4rem] w-80 h-80 bg-secondary/60 brand-blob opacity-40" />

      <div className="relative z-10 w-full max-w-sm text-center">
        <img src={logo} alt="Pautisserie" className="w-48 mx-auto mb-8" />
        <h1 className="font-display text-2xl font-semibold text-foreground mb-1">Gestión de Costos</h1>
        <p className="text-sm text-muted-foreground font-body mb-8">
          {mode === "login" ? "Iniciá sesión para acceder" : "Creá tu cuenta"}
        </p>

        {success ? (
          <div className="space-y-4">
            <p className="text-sm text-primary font-body bg-primary/10 rounded-xl px-4 py-3">{success}</p>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError("");
                const { error } = await supabase.auth.resend({ type: "signup", email });
                setLoading(false);
                if (error) {
                  setError(error.message);
                } else {
                  setSuccess("Email de verificación reenviado. Revisá tu bandeja de entrada.");
                }
              }}
              className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-body font-semibold text-sm transition-opacity disabled:opacity-50"
            >
              {loading ? "Enviando..." : "¿No te llegó? Reenviar email"}
            </button>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              onClick={() => { setMode("login"); setSuccess(""); setError(""); setPassword(""); setConfirmPassword(""); }}
              className="text-sm text-muted-foreground underline"
            >
              Ir a iniciar sesión
            </button>
          </div>
        ) : mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm transition-opacity disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(""); setPassword(""); }}
              className="text-sm text-muted-foreground underline"
            >
              ¿No tenés cuenta? Registrate
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña (mín. 6 caracteres)"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar contraseña"
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm transition-opacity disabled:opacity-50"
            >
              {loading ? "Registrando..." : "Crear cuenta"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); setPassword(""); setConfirmPassword(""); }}
              className="text-sm text-muted-foreground underline"
            >
              ¿Ya tenés cuenta? Iniciá sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
