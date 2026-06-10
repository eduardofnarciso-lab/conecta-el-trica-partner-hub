import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BarChart3, Users, Megaphone, Gift, CheckSquare, FileText, Receipt, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin")({
  component: AdminLayout,
});

const tabs = [
  { to: "/admin", label: "Visão Geral", icon: BarChart3, exact: true },
  { to: "/admin/parceiros", label: "Eletricistas", icon: Users },
  { to: "/admin/notas", label: "Lançamento de Notas", icon: Receipt },
  { to: "/admin/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/admin/premios", label: "Prêmios", icon: Gift },
  { to: "/admin/aprovacoes", label: "Aprovação de Pontos", icon: CheckSquare },
  { to: "/admin/comissoes", label: "Comissões", icon: DollarSign },
  { to: "/admin/relatorios", label: "Relatórios", icon: FileText },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="text-xs uppercase tracking-wider text-primary font-semibold">Administração</div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Painel do gestor</h1>
      </div>
      <div className="border-b border-border overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to as any}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px",
                  active ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
