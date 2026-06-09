import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Zap, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Clube Conecta Elétrica" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("eduardo@conectaeletrica.com");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Bem-vindo de volta, Eduardo!");
      navigate({ to: "/" });
    }, 700);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex relative flex-col justify-between p-10 bg-sidebar text-sidebar-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-energy text-energy-foreground flex items-center justify-center">
            <Zap className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-lg font-semibold">Clube Conecta Elétrica</div>
            <div className="text-xs uppercase tracking-widest text-sidebar-foreground/60">SaaS Programa de Parceiros</div>
          </div>
        </div>
        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Energize sua rede de <span className="text-energy">parceiros</span>.
          </h1>
          <p className="text-sidebar-foreground/70">
            Programa de relacionamento, pontuação e fidelização para eletricistas,
            engenheiros, instaladores solares e revendas do setor elétrico.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { v: "+1.800", l: "Parceiros" },
              { v: "12M+", l: "Pontos distribuídos" },
              { v: "98%", l: "Satisfação" },
            ].map((s) => (
              <div key={s.l} className="border-l-2 border-energy pl-3">
                <div className="text-2xl font-bold">{s.v}</div>
                <div className="text-xs text-sidebar-foreground/60">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-sidebar-foreground/50">
          © 2026 Clube Conecta Elétrica. Todos os direitos reservados.
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <div className="font-semibold">Clube Conecta Elétrica</div>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Entrar na sua conta</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse seu painel de parceiro e veja seus pontos.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <button type="button" className="text-xs text-primary hover:underline" onClick={() => toast.info("Enviamos um e-mail de recuperação.")}>
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" required />
              </div>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 text-base font-semibold">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Ambiente de demonstração — qualquer e-mail e senha funcionam.
          </p>
        </form>
      </div>
    </div>
  );
}
