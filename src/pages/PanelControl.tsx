import { useMemo } from "react";
import { formatCurrency } from "@/data/productos";
import { useIngredientes } from "@/context/IngredientesContext";
import { DollarSign, TrendingUp, ShoppingCart, Award, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const PanelControl = () => {
  const { productos, pedidos, loading } = useIngredientes();

  const stats = useMemo(() => {
    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();

    const pedidosCompletados = pedidos.filter(p => p.estado === "completado");
    const pedidosMes = pedidosCompletados.filter(p => {
      const d = new Date(p.fechaEntrega);
      return d.getMonth() === mesActual && d.getFullYear() === anioActual;
    });

    const ingresosTotal = pedidosCompletados.reduce((a, p) => a + p.ingresoTotal, 0);
    const gastosTotal = pedidosCompletados.reduce((a, p) => a + p.costoTotal, 0);
    const gananciaTotal = ingresosTotal - gastosTotal;

    const ingresosMes = pedidosMes.reduce((a, p) => a + p.ingresoTotal, 0);
    const gastosMes = pedidosMes.reduce((a, p) => a + p.costoTotal, 0);
    const gananciaMes = ingresosMes - gastosMes;

    const cantVendidaTotal = pedidosCompletados.reduce((a, p) => a + p.productos.reduce((b, pp) => b + pp.cantidad, 0), 0);
    const cantVendidaMes = pedidosMes.reduce((a, p) => a + p.productos.reduce((b, pp) => b + pp.cantidad, 0), 0);

    // Product analysis
    const ventasPorProducto = new Map<string, { nombre: string; cantVendida: number; ganancia: number }>();
    pedidosCompletados.forEach(pedido => {
      pedido.productos.forEach(pp => {
        const prev = ventasPorProducto.get(pp.productoId) || { nombre: pp.nombre, cantVendida: 0, ganancia: 0 };
        prev.cantVendida += pp.cantidad;
        prev.ganancia += (pp.precioUnitario - pp.costoUnitario) * pp.cantidad;
        ventasPorProducto.set(pp.productoId, prev);
      });
    });

    const topVendidos = Array.from(ventasPorProducto.values()).sort((a, b) => b.cantVendida - a.cantVendida).slice(0, 5);
    const topGanancia = Array.from(ventasPorProducto.values()).sort((a, b) => b.ganancia - a.ganancia).slice(0, 5);

    // Monthly chart data (last 6 months)
    const meses: { mes: string; ingresos: number; gastos: number; ganancia: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anioActual, mesActual - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const pMes = pedidosCompletados.filter(p => {
        const fd = new Date(p.fechaEntrega);
        return fd.getMonth() === m && fd.getFullYear() === y;
      });
      meses.push({
        mes: d.toLocaleDateString("es-AR", { month: "short" }),
        ingresos: pMes.reduce((a, p) => a + p.ingresoTotal, 0),
        gastos: pMes.reduce((a, p) => a + p.costoTotal, 0),
        ganancia: pMes.reduce((a, p) => a + p.ganancia, 0),
      });
    }

    return { ingresosTotal, gastosTotal, gananciaTotal, ingresosMes, gastosMes, gananciaMes, cantVendidaTotal, cantVendidaMes, topVendidos, topGanancia, meses };
  }, [pedidos, productos]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const CHART_COLORS = ["hsl(25, 40%, 28%)", "hsl(145, 50%, 36%)", "hsl(38, 90%, 55%)"];

  return (
    <div className="min-h-screen bg-background space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon={<DollarSign className="w-4 h-4" />} label="Ingresos totales" value={formatCurrency(stats.ingresosTotal)} />
        <MetricCard icon={<DollarSign className="w-4 h-4" />} label="Gastos totales" value={formatCurrency(stats.gastosTotal)} />
        <MetricCard icon={<TrendingUp className="w-4 h-4" />} label="Ganancia total" value={formatCurrency(stats.gananciaTotal)} highlight />
        <MetricCard icon={<ShoppingCart className="w-4 h-4" />} label="Vendidos total" value={stats.cantVendidaTotal.toString()} />
      </div>

      {/* Monthly */}
      <div className="bg-card rounded-xl p-4">
        <h3 className="font-display text-base font-semibold text-foreground mb-3">Este mes</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="text-sm font-semibold text-foreground">{formatCurrency(stats.ingresosMes)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Gastos</p>
            <p className="text-sm font-semibold text-foreground">{formatCurrency(stats.gastosMes)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Ganancia</p>
            <p className="text-sm font-semibold text-success">{formatCurrency(stats.gananciaMes)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">{stats.cantVendidaMes} unidades vendidas</p>
      </div>

      {/* Chart */}
      {stats.meses.some(m => m.ingresos > 0) && (
        <div className="bg-card rounded-xl p-4">
          <h3 className="font-display text-base font-semibold text-foreground mb-3">Últimos 6 meses</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.meses} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(30, 20%, 85%)", fontSize: "12px" }}
                />
                <Bar dataKey="ganancia" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {stats.meses.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[1]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top products */}
      {stats.topVendidos.length > 0 && (
        <div className="bg-card rounded-xl p-4">
          <h3 className="font-display text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" /> Más vendidos
          </h3>
          {stats.topVendidos.map((p, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5">
              <span className="text-foreground">{p.nombre}</span>
              <span className="text-muted-foreground font-medium">{p.cantVendida} uds</span>
            </div>
          ))}
        </div>
      )}

      {stats.topGanancia.length > 0 && (
        <div className="bg-card rounded-xl p-4">
          <h3 className="font-display text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" /> Mayor ganancia
          </h3>
          {stats.topGanancia.map((p, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5">
              <span className="text-foreground">{p.nombre}</span>
              <span className="text-success font-medium">{formatCurrency(p.ganancia)}</span>
            </div>
          ))}
        </div>
      )}

      {pedidos.filter(p => p.estado === "completado").length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Las métricas se generan a partir de los pedidos completados.<br />
          Creá pedidos y marcalos como completados para ver estadísticas.
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) => (
  <div className="bg-card rounded-xl p-3">
    <div className="flex items-center gap-2 mb-1 text-muted-foreground">{icon}<span className="text-xs font-body">{label}</span></div>
    <p className={`text-base font-semibold font-display ${highlight ? "text-success" : "text-foreground"}`}>{value}</p>
  </div>
);

export default PanelControl;
