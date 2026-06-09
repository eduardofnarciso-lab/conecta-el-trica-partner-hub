import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Megaphone,
  Trophy,
  Receipt,
  Gift,
  UserPlus,
  User,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { currentUser } from "@/lib/mocks";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const nav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/extrato", label: "Extrato de Pontos", icon: Receipt },
  { to: "/loja", label: "Loja de Prêmios", icon: Gift },
  { to: "/indicacoes", label: "Indicações", icon: UserPlus },
  { to: "/perfil", label: "Meu Perfil", icon: User },
  { to: "/admin", label: "Administração", icon: ShieldCheck },
];

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-energy text-energy-foreground shadow-sm">
        <Zap className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-sidebar-foreground">Clube Conecta</div>
        <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">Elétrica</div>
      </div>
    </div>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {nav.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to as any}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-energy" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="h-16 flex items-center border-b border-sidebar-border">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <NavList pathname={pathname} />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => navigate({ to: "/login" })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col">
            <div className="h-16 flex items-center justify-between border-b border-sidebar-border pr-3">
              <Brand />
              <button onClick={() => setOpen(false)} className="text-sidebar-foreground/70">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center px-4 md:px-6 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="bg-energy/15 text-foreground border border-energy/30">
              <Zap className="h-3 w-3 mr-1" /> {currentUser.points.toLocaleString("pt-BR")} pts
            </Badge>
          </div>
          <div className="flex items-center gap-3 pl-2 border-l border-border">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium leading-tight">{currentUser.name}</div>
              <div className="text-xs text-muted-foreground">{currentUser.type} · {currentUser.tier}</div>
            </div>
            <Avatar className="h-9 w-9 border-2 border-energy/40">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {currentUser.avatar}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border flex justify-around py-2">
          {nav.slice(0, 5).map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as any}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
