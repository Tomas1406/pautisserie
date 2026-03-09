import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "@/pages/Dashboard";
import Ingredientes from "@/pages/Ingredientes";
import logo from "@/assets/logo.jpeg";
import { LayoutDashboard, ShoppingBasket, LogOut } from "lucide-react";

const tabs = [
  { id: "productos", label: "Productos", icon: LayoutDashboard },
  { id: "ingredientes", label: "Ingredientes", icon: ShoppingBasket },
] as const;

type Tab = typeof tabs[number]["id"];

const AppLayout = () => {
  const [activeTab, setActiveTab] = useState<Tab>("productos");
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Pautisserie" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-display text-lg font-semibold text-foreground">Pautisserie</span>
        </div>
        <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-4 pb-24">
        {activeTab === "productos" && <Dashboard />}
        {activeTab === "ingredientes" && <Ingredientes />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border px-4 pb-6 pt-2 z-50">
        <div className="flex justify-around max-w-md mx-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-1 px-4 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-body font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
