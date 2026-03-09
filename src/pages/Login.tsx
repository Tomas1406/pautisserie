import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.jpeg";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Map username to the internal email
    const email = `${username.toLowerCase()}@app.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError("Usuario o contraseña incorrectos.");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="fixed top-[-5rem] right-[-5rem] w-64 h-64 bg-accent/40 brand-blob opacity-50" />
      <div className="fixed bottom-[-8rem] left-[-4rem] w-80 h-80 bg-secondary/60 brand-blob opacity-40" />

      <div className="relative z-10 w-full max-w-sm text-center">
        <img src={logo} alt="Pautisserie" className="w-48 mx-auto mb-8" />
        <h1 className="font-display text-2xl font-semibold text-foreground mb-1">Gestión de Costos</h1>
        <p className="text-sm text-muted-foreground font-body mb-8">Iniciá sesión para acceder</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuario"
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
        </form>
      </div>
    </div>
  );
};

export default Login;
