import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "@/pages/Dashboard";
import Ingredientes from "@/pages/Ingredientes";
import Pedidos from "@/pages/Pedidos";
import PanelControl from "@/pages/PanelControl";
import { IngredientesProvider } from "@/context/IngredientesContext";
import logo from "@/assets/logo-pautisserie.jpeg";
import { LayoutDashboard, ShoppingBasket, LogOut, ClipboardList, BarChart3 } from "lucide-react";

const tabs = [
  { id: "panel", label: "Panel", icon: BarChart3 },
  { id: "productos", label: "Productos", icon: LayoutDashboard },
  { id: "ingredientes", label: "Ingredientes", icon: ShoppingBasket },
  { id: "pedidos", label: "Pedidos", icon: ClipboardList },
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
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Pautisserie" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-display text-lg font-semibold text-foreground tracking-wide">PAUTISSERIE</span>
        </div>
        <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <IngredientesProvider>
        <main className="flex-1 px-4 py-4 pb-24">
          {activeTab === "panel" && <PanelControl />}
          {activeTab === "productos" && <Dashboard />}
          {activeTab === "ingredientes" && <Ingredientes />}
          {activeTab === "pedidos" && <Pedidos />}
        </main>
      </IngredientesProvider>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border px-4 pb-6 pt-2 z-50">
        <div className="flex justify-around max-w-md mx-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-body font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
