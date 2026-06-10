import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo, LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Elettro Ponto · Clube de Pontos" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("eduardo.f.narciso@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error("Não foi possível entrar. Verifique e-mail e senha.");
      setLoading(false);
      return;
    }
    toast.success("Bem-vindo ao Clube de Pontos Elettro Ponto!");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex relative flex-col justify-between p-10 bg-sidebar text-sidebar-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative flex items-center gap-3">
          <LogoMark className="h-12 w-12" />
          <div>
            <div className="text-lg font-extrabold italic tracking-tight">
              Elettro<span className="align-super text-[0.5em] font-semibold">®</span> <span className="font-medium not-italic opacity-90">ponto</span>
            </div>
            <div className="text-xs uppercase tracking-widest text-sidebar-foreground/60">Clube de Pontos do Eletricista</div>
          </div>
        </div>
        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Pontue, suba no <span className="text-energy">ranking</span> e ganhe prêmios.
          </h1>
          <p className="text-sidebar-foreground/70">
            Programa de pontuação e premiação para eletricistas parceiros da
            Elettro Ponto. A cada compra, mais pontos no ranking da campanha.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { v: "12", l: "Eletricistas" },
              { v: "Top 10", l: "Premiados" },
              { v: "Tatuí-SP", l: "Elettro Ponto" },
            ].map((s) => (
              <div key={s.l} className="border-l-2 border-energy pl-3">
                <div className="text-2xl font-bold">{s.v}</div>
                <div className="text-xs text-sidebar-foreground/60">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-sidebar-foreground/50">
          © 2026{" "}
          <a
            href="https://spiritrelay.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-sidebar-foreground/80"
          >
            spiritrelay.com
          </a>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          <div className="lg:hidden mb-2">
            <Logo className="text-foreground" />
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
            Acesso restrito — use as credenciais cadastradas no sistema.
          </p>
        </form>
      </div>
    </div>
  );
}
