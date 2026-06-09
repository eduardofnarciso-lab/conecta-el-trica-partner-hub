import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/badges";
import { mockReferrals } from "@/lib/mocks";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/indicacoes")({
  component: IndicacoesPage,
});

function IndicacoesPage() {
  const [form, setForm] = useState({
    name: "", phone: "", city: "", type: "Residencial", notes: "",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Indicação enviada com sucesso! Você será notificado quando for analisada.");
    setForm({ name: "", phone: "", city: "", type: "Residencial", notes: "" });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Indicações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Indique novas obras, clientes ou empresas e acumule pontos.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-4 w-4" /> Nova indicação</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome do cliente/obra</Label>
                <Input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" required value={form.city} onChange={(e) => set("city", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de demanda</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Residencial">Residencial</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                    <SelectItem value="Solar">Solar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Detalhes sobre a obra..." />
              </div>
              <Button type="submit" className="w-full">
                <Send className="h-4 w-4 mr-2" /> Enviar indicação
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Indicações enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 pr-3">Cliente</th>
                    <th className="py-3 pr-3">Data</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3 pr-3 text-right">Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  {mockReferrals.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-3 font-medium">{r.client}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{new Date(r.date).toLocaleDateString("pt-BR")}</td>
                      <td className="py-3 pr-3"><StatusBadge status={r.status} /></td>
                      <td className={`py-3 pr-3 text-right font-semibold ${r.points > 0 ? "text-success" : "text-muted-foreground"}`}>
                        {r.points > 0 ? `+${r.points}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
