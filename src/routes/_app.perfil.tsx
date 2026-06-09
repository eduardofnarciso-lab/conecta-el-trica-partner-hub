import { createFileRoute } from "@tanstack/react-router";
import { Mail, Building2, MapPin, Calendar, FileBadge, Pencil, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TierBadge } from "@/components/badges";
import { currentUser, mockTransactions } from "@/lib/mocks";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/perfil")({
  component: PerfilPage,
});

function PerfilPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary via-primary/80 to-sidebar relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        </div>
        <CardContent className="-mt-12 pb-6">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div className="flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-card">
                <AvatarFallback className="bg-energy text-energy-foreground text-2xl font-bold">{currentUser.avatar}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="text-xl md:text-2xl font-bold">{currentUser.name}</h1>
                <p className="text-sm text-muted-foreground">{currentUser.type}</p>
                <div className="mt-2 flex items-center gap-2">
                  <TierBadge tier={currentUser.tier} />
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3 text-energy" /> {currentUser.points.toLocaleString("pt-BR")} pts
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => toast.info("Modo edição em breve.")}>
              <Pencil className="h-4 w-4 mr-2" /> Editar perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Dados pessoais</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
            <Info icon={<Mail className="h-4 w-4" />} label="E-mail" value={currentUser.email} />
            <Info icon={<Building2 className="h-4 w-4" />} label="Empresa" value={currentUser.company} />
            <Info icon={<MapPin className="h-4 w-4" />} label="Cidade" value={currentUser.city} />
            <Info icon={<Calendar className="h-4 w-4" />} label="Parceiro desde" value={new Date(currentUser.joinedAt).toLocaleDateString("pt-BR")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Credenciais</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "NR10 Básico", date: "Válido até 2027" },
              { label: "NR35 Trabalho em Altura", date: "Válido até 2026" },
              { label: "Integrador Solar Certificado", date: "Emitido em 2024" },
            ].map((c) => (
              <div key={c.label} className="flex items-start gap-3 text-sm">
                <FileBadge className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">{c.label}</div>
                  <div className="text-xs text-muted-foreground">{c.date}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico resumido</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockTransactions.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 py-2">
                <div>
                  <div className="font-medium">{t.description}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString("pt-BR")} · {t.type}</div>
                </div>
                <div className={`font-semibold ${t.points >= 0 ? "text-success" : "text-destructive"}`}>
                  {t.points > 0 ? "+" : ""}{t.points}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center text-primary">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
