import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MapPin, Phone, Wrench, Pencil, Zap, UserX, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TierBadge, StatusBadge } from "@/components/badges";
import { supabase } from "@/lib/supabase";
import { useAuth, roleLabel } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/perfil")({
  component: PerfilPage,
});

type Eletricista = {
  id: string;
  nome: string;
  apelido: string | null;
  telefone: string | null;
  email: string | null;
  cidade: string | null;
  uf: string | null;
  segmento: string | null;
  status: string;
};

type Nivel = { id: string; nome: string; pontos_min: number };

type Transacao = {
  id: string;
  tipo: string;
  pontos: number;
  descricao: string | null;
  origem: string | null;
  created_at: string;
};

const TIPO_LABEL: Record<string, string> = {
  ganho: "Ganho",
  resgate: "Resgate",
  ajuste: "Ajuste",
  estorno: "Estorno",
};

const ELETRICISTA_STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  bloqueado: "Bloqueado",
  pendente: "Pendente",
};

function initials(nome: string) {
  const parts = nome.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "EP";
}

function PerfilPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ telefone: "", cidade: "" });

  const { data: eletricista, isLoading: loadingEletricista } = useQuery({
    queryKey: ["eletricista-perfil", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eletricistas")
        .select("id, nome, apelido, telefone, email, cidade, uf, segmento, status")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Eletricista | null;
    },
  });

  const { data: niveis = [] } = useQuery({
    queryKey: ["niveis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("niveis")
        .select("id, nome, pontos_min")
        .order("pontos_min", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Nivel[];
    },
  });

  const { data: saldo = 0 } = useQuery({
    queryKey: ["saldo-eletricista", eletricista?.id],
    enabled: !!eletricista?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_saldo_eletricista")
        .select("saldo")
        .eq("eletricista_id", eletricista!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.saldo ?? 0;
    },
  });

  const { data: transacoes = [] } = useQuery({
    queryKey: ["perfil-transacoes", eletricista?.id],
    enabled: !!eletricista?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes_pontos")
        .select("id, tipo, pontos, descricao, origem, created_at")
        .eq("eletricista_id", eletricista!.id)
        .neq("status", "cancelado")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data ?? []) as Transacao[];
    },
  });

  let nivelAtual: Nivel | null = null;
  for (const n of niveis) if (saldo >= n.pontos_min) nivelAtual = n;
  if (!nivelAtual) nivelAtual = niveis[0] ?? null;

  function startEdit() {
    setForm({
      telefone: eletricista?.telefone ?? "",
      cidade: eletricista?.cidade ?? "",
    });
    setEditing(true);
  }

  async function save() {
    if (!eletricista) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("eletricistas")
        .update({ telefone: form.telefone || null, cidade: form.cidade || null })
        .eq("id", eletricista.id);
      if (error) {
        toast.error("Não foi possível salvar: " + error.message);
        return;
      }
      toast.success("Dados atualizados com sucesso!");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["eletricista-perfil", profile?.id] });
    } finally {
      setSaving(false);
    }
  }

  if (!profile || loadingEletricista) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  const displayName = eletricista?.nome ?? profile.nome;

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
                <AvatarFallback className="bg-energy text-energy-foreground text-2xl font-bold">{initials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="text-xl md:text-2xl font-bold">{displayName}</h1>
                <p className="text-sm text-muted-foreground">{roleLabel(profile.role)}</p>
                {eletricista && (
                  <div className="mt-2 flex items-center gap-2">
                    {nivelAtual && <TierBadge tier={nivelAtual.nome} />}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3 text-energy" /> {saldo.toLocaleString("pt-BR")} pts
                    </span>
                    <StatusBadge status={ELETRICISTA_STATUS_LABEL[eletricista.status] ?? eletricista.status} />
                  </div>
                )}
              </div>
            </div>
            {eletricista && !editing && (
              <Button variant="outline" onClick={startEdit}>
                <Pencil className="h-4 w-4 mr-2" /> Editar perfil
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!eletricista ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <UserX className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium text-foreground">Seu usuário não está vinculado a um cadastro de eletricista.</p>
            <p className="text-sm mt-1">Os dados de pontuação e categoria ficam disponíveis apenas para eletricistas cadastrados.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Dados pessoais</CardTitle></CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={form.telefone}
                      onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
                      placeholder="(15) 99999-9999"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={form.cidade}
                      onChange={(e) => setForm((p) => ({ ...p, cidade: e.target.value }))}
                      placeholder="Tatuí"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={save} disabled={saving}>
                      <Check className="h-4 w-4 mr-2" /> {saving ? "Salvando…" : "Salvar"}
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                      <X className="h-4 w-4 mr-2" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <Info icon={<Mail className="h-4 w-4" />} label="E-mail" value={eletricista.email ?? profile.email ?? "—"} />
                  <Info icon={<Phone className="h-4 w-4" />} label="Telefone" value={eletricista.telefone ?? "—"} />
                  <Info
                    icon={<MapPin className="h-4 w-4" />}
                    label="Cidade"
                    value={eletricista.cidade ? `${eletricista.cidade}${eletricista.uf ? ` - ${eletricista.uf}` : ""}` : "—"}
                  />
                  <Info icon={<Wrench className="h-4 w-4" />} label="Segmento" value={eletricista.segmento ?? "—"} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Histórico resumido</CardTitle></CardHeader>
            <CardContent>
              {transacoes.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma transação ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  {transacoes.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 py-2">
                      <div>
                        <div className="font-medium">{t.descricao ?? t.origem ?? TIPO_LABEL[t.tipo] ?? t.tipo}</div>
                        <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")} · {TIPO_LABEL[t.tipo] ?? t.tipo}</div>
                      </div>
                      <div className={`font-semibold ${t.pontos >= 0 ? "text-success" : "text-destructive"}`}>
                        {t.pontos > 0 ? "+" : ""}{t.pontos.toLocaleString("pt-BR")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
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
