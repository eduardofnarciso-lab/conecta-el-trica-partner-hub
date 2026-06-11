export type NfeItem = {
  codigo: string;
  descricao: string;
  ncm: string;
  quantidade: number;
  valor: number;
};

export type NfeParsed = {
  numero: string;
  dataEmissao: string;
  valorTotal: number;
  emitente: string;
  destinatario: string;
  itens: NfeItem[];
};

function txt(el: Element | Document, tag: string): string {
  return el.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
}

export function parseNfeXml(xml: string): NfeParsed {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("XML inválido. Confira se o arquivo é o XML da NF-e.");
  }
  const dets = Array.from(doc.getElementsByTagName("det"));
  if (dets.length === 0) {
    throw new Error("Nenhum item encontrado no XML. O arquivo é uma NF-e?");
  }
  const itens: NfeItem[] = dets.map((det) => ({
    codigo: txt(det, "cProd"),
    descricao: txt(det, "xProd"),
    ncm: txt(det, "NCM"),
    quantidade: Number(txt(det, "qCom")) || 1,
    valor: Number(txt(det, "vProd")) || 0,
  }));
  const dataRaw = txt(doc, "dhEmi") || txt(doc, "dEmi");
  return {
    numero: txt(doc, "nNF"),
    dataEmissao: dataRaw.slice(0, 10),
    valorTotal: Number(txt(doc, "vNF")) || itens.reduce((s, i) => s + i.valor, 0),
    emitente: txt(doc.getElementsByTagName("emit")[0] ?? doc, "xNome"),
    destinatario: txt(doc.getElementsByTagName("dest")[0] ?? doc, "xNome"),
    itens,
  };
}

export type CategoriaMatch = {
  id: string;
  nome: string;
  codigos: string[];
  palavras_chave: string[];
  ncm_prefixos: string[];
  pontos_por_real: number;
};

export function matchCategoria(item: NfeItem, categorias: CategoriaMatch[]): CategoriaMatch | null {
  const desc = item.descricao.toLowerCase();
  const ncm = (item.ncm || "").replace(/\D/g, "");
  const codigo = (item.codigo || "").trim().toLowerCase();
  for (const cat of categorias) {
    if (codigo && (cat.codigos ?? []).some((c) => c && c.trim().toLowerCase() === codigo)) return cat;
  }
  for (const cat of categorias) {
    if (ncm && cat.ncm_prefixos.some((p) => p && ncm.startsWith(p))) return cat;
  }
  for (const cat of categorias) {
    if (cat.palavras_chave.some((k) => k && desc.includes(k))) return cat;
  }
  return null;
}

function brNum(s: string): number {
  return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
}

// Interpreta texto de orçamento/cupom (formato do PDV Elettro Ponto).
// Tolerante a ruído de OCR: remove colchetes/pipes, emenda linha quebrada
// e, se o total caiu da linha, calcula total = quantidade × valor unitário.
export function parseOrcamentoTexto(texto: string): NfeItem[] {
  const itens: NfeItem[] = [];

  const brutas = texto.split("\n").map((raw) =>
    raw.replace(/[\[\]|｜!{}'"´`]/g, " ").replace(/\s+/g, " ").trim(),
  );
  const linhas: string[] = [];
  for (let i = 0; i < brutas.length; i++) {
    let line = brutas[i];
    if (!line) continue;
    const prox = brutas[i + 1] ?? "";
    const pareceItem = /^\d{3,6}\s/.test(line);
    const proxSoNumeros = /^[\d.,\s]+$/.test(prox) && prox.length <= 24 && prox.length > 0;
    if (pareceItem && proxSoNumeros) {
      line = line + " " + prox;
      i++;
    }
    linhas.push(line);
  }

  for (const line of linhas) {
    if (!line || /^[-=*._ ]+$/.test(line)) continue;
    if (/CNPJ|FONE|EMISS|TOTAL|PAGAMENTO|CLIENTE|VENDEDOR|ENDERECO|CIDADE|DESCRI/i.test(line)) continue;

    let m = line.match(/^(\d+)?\s*([\d.,]+)\s+(UN|UM|MT|MTS|PC|PÇ|CX|M|KG|RL|PCT)\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)\D{0,3}$/i);
    if (m) {
      itens.push({
        codigo: m[1] ?? "",
        descricao: m[4].trim(),
        ncm: "",
        quantidade: brNum(m[2]),
        valor: brNum(m[6]),
      });
      continue;
    }

    m = line.match(/^(\d+)?\s*([\d.,]+)\s+(UN|UM|MT|MTS|PC|PÇ|CX|M|KG|RL|PCT)\s+(.+?)\s+([\d.,]+)\D{0,3}$/i);
    if (m) {
      const qtd = brNum(m[2]);
      const unit = brNum(m[5]);
      if (qtd > 0 && unit > 0) {
        itens.push({
          codigo: m[1] ?? "",
          descricao: m[4].trim(),
          ncm: "",
          quantidade: qtd,
          valor: Math.round(qtd * unit * 100) / 100,
        });
        continue;
      }
    }

    const f = line.match(/^(\d{3,6})\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)\D{0,3}$/);
    if (f) {
      const desc = f[2]
        .replace(/^[\d.,]+\s+(UN|UM|MT|MTS|PC|PÇ|CX|M|KG|RL|PCT)\s+/i, "")
        .replace(/^[\d.,]+\s+/, "")
        .trim();
      if (desc.length >= 4 && /[A-Za-z]{3}/.test(desc)) {
        itens.push({
          codigo: f[1],
          descricao: desc,
          ncm: "",
          quantidade: 1,
          valor: brNum(f[4]),
        });
      }
    }
  }
  return itens;
}
