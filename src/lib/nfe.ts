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
  palavras_chave: string[];
  ncm_prefixos: string[];
  pontos_por_real: number;
};

export function matchCategoria(item: NfeItem, categorias: CategoriaMatch[]): CategoriaMatch | null {
  const desc = item.descricao.toLowerCase();
  const ncm = (item.ncm || "").replace(/\D/g, "");
  for (const cat of categorias) {
    if (ncm && cat.ncm_prefixos.some((p) => p && ncm.startsWith(p))) return cat;
  }
  for (const cat of categorias) {
    if (cat.palavras_chave.some((k) => k && desc.includes(k))) return cat;
  }
  return null;
}
