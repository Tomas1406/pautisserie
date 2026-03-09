import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.jpeg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const allowedEmails = ["tomas.moschen@gmail.com", "paulibrach15@outlook.com"];
    if (!allowedEmails.includes(email.toLowerCase())) {
      setError("Este email no tiene acceso a la aplicación.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    
    if (error) {
      setError(error.message);
    } else {
      setStep("otp");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    setLoading(false);
    
    if (error) {
      setError("Código inválido. Intentá de nuevo.");
    } else {
      navigate("/");
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
          {step === "email" ? "Ingresá tu email para acceder" : "Ingresá el código que recibiste"}
        </p>

        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm transition-opacity disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Código de 6 dígitos"
              maxLength={6}
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-body text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm transition-opacity disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Verificar"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(""); setError(""); }}
              className="text-sm text-muted-foreground underline"
            >
              Cambiar email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
