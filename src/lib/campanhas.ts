import { supabase } from "@/lib/supabase";

export type Campanha = {
  id: string;
  nome: string;
  descricao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
  destaque: boolean;
  premiacao_top: number;
  pontos_por_real: number | null;
  regras: string[] | null;
};

export const CAMPANHA_STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  agendada: "Em breve",
  ativa: "Ativa",
  encerrada: "Encerrada",
};

function fmtDate(d: string | null) {
  if (!d) return null;
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function campanhaPeriodo(c: Campanha) {
  const a = fmtDate(c.data_inicio);
  const b = fmtDate(c.data_fim);
  if (a && b) return `${a} — ${b}`;
  if (a) return `A partir de ${a}`;
  return "Permanente";
}

export function campanhaPontosLabel(c: Campanha) {
  if (c.pontos_por_real) return `${Number(c.pontos_por_real).toLocaleString("pt-BR")} pts por R$ 1,00`;
  return `Top ${c.premiacao_top} premiados`;
}

export async function fetchCampanhasPublicas(): Promise<Campanha[]> {
  const { data, error } = await supabase
    .from("campanhas")
    .select("*")
    .neq("status", "rascunho")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Campanha[];
}

export async function fetchCampanha(id: string): Promise<Campanha | null> {
  const { data, error } = await supabase
    .from("campanhas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Campanha) ?? null;
}
