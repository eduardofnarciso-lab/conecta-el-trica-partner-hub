// Mock data — Elettro Ponto · Clube de Pontos do Eletricista (Tatuí - SP)
export type Tier = "Bronze" | "Prata" | "Ouro" | "Diamante";

export const TIERS: { name: Tier; min: number; color: string }[] = [
  { name: "Bronze", min: 0, color: "bronze" },
  { name: "Prata", min: 5000, color: "silver" },
  { name: "Ouro", min: 10000, color: "gold" },
  { name: "Diamante", min: 15000, color: "diamond" },
];

// Usuário master (admin que enxerga tudo). Por enquanto há um único usuário
// com acesso total — o controle de permissões por usuário virá depois.
export const currentUser = {
  id: "u-001",
  name: "Eduardo Narciso",
  email: "eduardo.f.narciso@gmail.com",
  type: "Administrador (Master)",
  role: "master" as const,
  company: "Elettro Ponto",
  city: "Tatuí - SP",
  tier: "Diamante" as Tier,
  points: 12450,
  rankPosition: 1,
  avatar: "EP",
  joinedAt: "2023-03-12",
};

export function nextTier(points: number) {
  for (const t of TIERS) if (points < t.min) return t;
  return null;
}
export function currentTier(points: number): Tier {
  let cur: Tier = "Bronze";
  for (const t of TIERS) if (points >= t.min) cur = t.name;
  return cur;
}

export const mockCampaigns = [
  {
    id: "cmp-001",
    name: "Campanha Cabos Premium",
    description: "Ganhe pontos a cada metro de cabo premium instalado em projetos residenciais e comerciais.",
    period: "01/06/2026 — 31/07/2026",
    points: "Até 5.000 pts",
    status: "Ativa" as const,
    highlight: true,
    rules: [
      "Válido para cabos da linha Premium Plus.",
      "Necessário cadastro da nota fiscal no app.",
      "Limite de 5.000 pontos por mês.",
    ],
  },
  {
    id: "cmp-002",
    name: "Campanha Energia Solar",
    description: "Bonificação especial para integradores em projetos fotovoltaicos acima de 5 kWp.",
    period: "15/05/2026 — 15/08/2026",
    points: "Até 8.000 pts",
    status: "Ativa" as const,
    highlight: false,
    rules: ["Projetos acima de 5 kWp.", "Comprovação por contrato e nota fiscal."],
  },
  {
    id: "cmp-003",
    name: "Campanha Disjuntores Inteligentes",
    description: "Pontuação dobrada na instalação de disjuntores DR e IDR inteligentes.",
    period: "01/05/2026 — 30/06/2026",
    points: "Até 3.000 pts",
    status: "Encerrada" as const,
    highlight: false,
    rules: ["Apenas linha Smart Breaker.", "Necessário foto da instalação."],
  },
  {
    id: "cmp-004",
    name: "Campanha Indique uma Obra",
    description: "Indique novas obras e ganhe pontos sempre que a indicação for convertida em venda.",
    period: "Permanente",
    points: "500 pts por conversão",
    status: "Em breve" as const,
    highlight: false,
    rules: ["Indicação aprovada pelo time comercial.", "Pontos liberados após fechamento."],
  },
];

export const mockTransactions = [
  { id: "t1", date: "2026-06-07", description: "Campanha Cabos Premium", type: "Ganho", points: 500, status: "Confirmado" },
  { id: "t2", date: "2026-06-05", description: "Indicação aprovada — Obra Edifício Atlas", type: "Indicação", points: 250, status: "Confirmado" },
  { id: "t3", date: "2026-06-02", description: "Resgate Furadeira Profissional", type: "Resgate", points: -1000, status: "Em separação" },
  { id: "t4", date: "2026-05-28", description: "Bônus de aniversário", type: "Ajuste", points: 100, status: "Confirmado" },
  { id: "t5", date: "2026-05-22", description: "Campanha Energia Solar", type: "Ganho", points: 1800, status: "Confirmado" },
  { id: "t6", date: "2026-05-15", description: "Resgate Vale combustível R$100", type: "Resgate", points: -2000, status: "Concluído" },
  { id: "t7", date: "2026-05-08", description: "Campanha Disjuntores Inteligentes", type: "Ganho", points: 1200, status: "Confirmado" },
  { id: "t8", date: "2026-04-30", description: "Indicação aprovada — Loja Center", type: "Indicação", points: 250, status: "Confirmado" },
] as const;

export const mockRewards = [
  { id: "r1", name: "Furadeira Profissional", description: "Furadeira de impacto 750W com maleta.", category: "Ferramentas", cost: 5000, available: true, emoji: "🔧" },
  { id: "r2", name: "Multímetro Digital", description: "Multímetro True RMS categoria CAT III.", category: "Ferramentas", cost: 2500, available: true, emoji: "📟" },
  { id: "r3", name: "Alicate Amperímetro", description: "Alicate amperímetro 600A AC/DC.", category: "Ferramentas", cost: 3000, available: true, emoji: "🪛" },
  { id: "r4", name: "Curso NR10 Básico", description: "Curso completo de segurança em instalações elétricas.", category: "Cursos", cost: 4000, available: true, emoji: "🎓" },
  { id: "r5", name: "Curso de Energia Solar", description: "Formação para integradores fotovoltaicos.", category: "Cursos", cost: 6000, available: true, emoji: "☀️" },
  { id: "r6", name: "Vale Combustível R$100", description: "Crédito em postos parceiros.", category: "Benefícios", cost: 2000, available: true, emoji: "⛽" },
  { id: "r7", name: "PIX R$50", description: "Crédito direto via PIX.", category: "PIX/Crédito", cost: 1000, available: true, emoji: "💸" },
  { id: "r8", name: "PIX R$200", description: "Crédito direto via PIX.", category: "PIX/Crédito", cost: 4000, available: true, emoji: "💸" },
  { id: "r9", name: "Jantar para 2 pessoas", description: "Experiência gastronômica em restaurante parceiro.", category: "Experiências", cost: 3500, available: false, emoji: "🍽️" },
  { id: "r10", name: "Plano de saúde — desconto", description: "Desconto em mensalidade de plano parceiro.", category: "Benefícios", cost: 5500, available: true, emoji: "❤️" },
];

export const rewardCategories = ["Todos", "Ferramentas", "Cursos", "Benefícios", "Experiências", "PIX/Crédito"] as const;

// Ranking da campanha — 12 eletricistas (somente eletricistas participam).
// Os 10 primeiros são premiados ao fim da campanha.
export const mockRanking = (() => {
  const names = ["Carlos Lima", "Roberto Alves", "Felipe Castro", "André Moreira", "Ricardo Tavares", "Marcos Vinícius", "Henrique Sá", "Bruno Mendes", "Igor Bastos", "Daniel Prado", "Anderson Ramos", "Wesley Tavares"];
  const cities = ["Tatuí - SP", "Sorocaba - SP", "Itapetininga - SP", "Boituva - SP", "Cerquilho - SP", "Cesário Lange - SP"];
  return names.map((name, i) => {
    const points = 14800 - i * 1050 - (i % 3) * 220;
    return {
      pos: i + 1,
      name,
      type: "Eletricista",
      city: cities[i % cities.length],
      points,
      tier: (points >= 15000 ? "Diamante" : points >= 10000 ? "Ouro" : points >= 5000 ? "Prata" : "Bronze") as Tier,
      prize: i < 10,
      isYou: false,
    };
  });
})();

export const mockReferrals = [
  { id: "ref-1", client: "Edifício Atlas", date: "2026-06-05", status: "Aprovada", points: 250 },
  { id: "ref-2", client: "Loja Center Mall", date: "2026-05-22", status: "Convertida", points: 800 },
  { id: "ref-3", client: "Residencial Park", date: "2026-06-01", status: "Em análise", points: 0 },
  { id: "ref-4", client: "Indústria Metalplus", date: "2026-04-18", status: "Reprovada", points: 0 },
];

export const monthlyPoints = [
  { month: "Jan", points: 800 },
  { month: "Fev", points: 1200 },
  { month: "Mar", points: 1500 },
  { month: "Abr", points: 1800 },
  { month: "Mai", points: 2300 },
  { month: "Jun", points: 2850 },
];

// Admin mocks
export const adminOverview = {
  totalPartners: 1847,
  pointsThisMonth: 482300,
  pendingRedemptions: 23,
  activeCampaigns: 6,
  salesThisMonth: 684627.22,
  purchasesThisMonth: 412,
  commissionsDue: 18342.5,
};

export const adminPartners = Array.from({ length: 12 }).map((_, i) => ({
  id: `p-${i + 1}`,
  name: ["Carlos Lima", "Roberto Alves", "Felipe Castro", "André Moreira", "Ricardo Tavares", "Marcos Vinícius", "Henrique Sá", "Bruno Mendes", "Igor Bastos", "Daniel Prado", "Anderson Ramos", "Wesley Tavares"][i],
  type: "Eletricista",
  city: ["Tatuí - SP", "Sorocaba - SP", "Itapetininga - SP", "Boituva - SP"][i % 4],
  tier: (["Diamante", "Ouro", "Prata", "Bronze"] as const)[i % 4],
  points: 20000 - i * 1300,
  status: i % 5 === 0 ? "Bloqueado" : "Ativo",
}));

export const adminApprovals = [
  { id: "ap-1", partner: "Carlos Lima", origin: "Campanha Cabos Premium", description: "Instalação 120m cabo", points: 500, date: "2026-06-07" },
  { id: "ap-2", partner: "Mariana Souza", origin: "Campanha Energia Solar", description: "Projeto 8 kWp residencial", points: 1500, date: "2026-06-06" },
  { id: "ap-3", partner: "Roberto Alves", origin: "Indicação", description: "Obra Shopping Norte", points: 800, date: "2026-06-05" },
];

export const reportCityEngagement = [
  { city: "Tatuí - SP", value: 92 },
  { city: "Sorocaba - SP", value: 88 },
  { city: "Itapetininga - SP", value: 76 },
  { city: "Boituva - SP", value: 71 },
  { city: "Cerquilho - SP", value: 64 },
];

// Compras / Obras registradas — origem dos pontos dos parceiros.
export type PurchaseStatus = "Confirmada" | "Em análise" | "Reprovada";
export const mockPurchases = [
  { id: "co-1", date: "2026-06-08", partner: "Carlos Lima", segment: "Iluminação", value: 4820.0, points: 480, seller: "Rodrigo", status: "Confirmada" as PurchaseStatus },
  { id: "co-2", date: "2026-06-08", partner: "Mariana Souza", segment: "Energia Solar", value: 18650.0, points: 1865, seller: "Fábio", status: "Confirmada" as PurchaseStatus },
  { id: "co-3", date: "2026-06-07", partner: "Roberto Alves", segment: "Materiais Elétricos", value: 2310.5, points: 231, seller: "Júnior", status: "Em análise" as PurchaseStatus },
  { id: "co-4", date: "2026-06-06", partner: "Patrícia Dias", segment: "Iluminação", value: 9120.0, points: 912, seller: "Rodrigo", status: "Confirmada" as PurchaseStatus },
  { id: "co-5", date: "2026-06-05", partner: "Felipe Castro", segment: "Materiais Elétricos", value: 1540.0, points: 154, seller: "Fábio", status: "Reprovada" as PurchaseStatus },
  { id: "co-6", date: "2026-06-04", partner: "Juliana Pires", segment: "Energia Solar", value: 27400.0, points: 2740, seller: "Júnior", status: "Confirmada" as PurchaseStatus },
  { id: "co-7", date: "2026-06-03", partner: "André Moreira", segment: "Iluminação", value: 6230.0, points: 623, seller: "Rodrigo", status: "Confirmada" as PurchaseStatus },
  { id: "co-8", date: "2026-06-02", partner: "Camila Rocha", segment: "Materiais Elétricos", value: 3890.0, points: 389, seller: "Fábio", status: "Em análise" as PurchaseStatus },
];

// Comissões da equipe de vendas (Rodrigo, Fábio, Júnior).
export type CommissionStatus = "Em aberto" | "Paga";
export const mockCommissions = [
  { id: "cm-1", seller: "Rodrigo", role: "Vendedor", period: "Junho/2026", sales: 38, salesValue: 184230.5, rate: 0.03, commission: 5526.92, status: "Em aberto" as CommissionStatus },
  { id: "cm-2", seller: "Fábio", role: "Vendedor", period: "Junho/2026", sales: 31, salesValue: 152980.0, rate: 0.03, commission: 4589.4, status: "Em aberto" as CommissionStatus },
  { id: "cm-3", seller: "Júnior", role: "Vendedor", period: "Junho/2026", sales: 27, salesValue: 141360.0, rate: 0.03, commission: 4240.8, status: "Em aberto" as CommissionStatus },
  { id: "cm-4", seller: "Rodrigo", role: "Vendedor", period: "Maio/2026", sales: 42, salesValue: 198450.0, rate: 0.03, commission: 5953.5, status: "Paga" as CommissionStatus },
  { id: "cm-5", seller: "Fábio", role: "Vendedor", period: "Maio/2026", sales: 29, salesValue: 138720.0, rate: 0.03, commission: 4161.6, status: "Paga" as CommissionStatus },
];
