import { parseOrcamentoTexto } from "@/lib/nfe";

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não consegui abrir a imagem."));
    img.src = url;
  });
}

function drawRotated(img: HTMLImageElement, deg: 0 | 90 | 180 | 270): HTMLCanvasElement {
  const MAX = 1800;
  const scale = Math.min(1, MAX / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  if (deg === 90 || deg === 270) {
    canvas.width = h;
    canvas.height = w;
  } else {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d")!;
  ctx.filter = "grayscale(1) contrast(1.5)";
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
  return canvas;
}

function pontuarTexto(texto: string): number {
  const itens = parseOrcamentoTexto(texto).length;
  let bonus = 0;
  if (/OR[ÇC]AMENTO|TOTAL|EMISSAO|VENDEDOR/i.test(texto)) bonus += 1;
  return itens * 10 + bonus;
}

export type OcrResultado = {
  texto: string;
  numero: string | null;
  data: string | null; // yyyy-mm-dd
};

export async function ocrOrcamento(
  file: File,
  onStatus?: (msg: string) => void,
): Promise<OcrResultado> {
  const Tesseract = await import("tesseract.js");
  const img = await fileToImage(file);
  const worker = await Tesseract.createWorker("por");

  let melhor = { score: -1, texto: "" };
  try {
    const ordens: (0 | 90 | 180 | 270)[] = [0, 270, 90, 180];
    for (let i = 0; i < ordens.length; i++) {
      onStatus?.(`Lendo a foto (tentativa ${i + 1} de ${ordens.length})…`);
      const canvas = drawRotated(img, ordens[i]);
      const { data } = await worker.recognize(canvas);
      const texto = (data.text ?? "").trim();
      const score = pontuarTexto(texto);
      if (score > melhor.score) melhor = { score, texto };
      if (parseOrcamentoTexto(texto).length >= 2) break;
    }
  } finally {
    await worker.terminate();
  }

  if (!melhor.texto || melhor.score <= 0) {
    throw new Error("Não consegui ler a foto. Tente com mais luz, sem inclinação e enquadrando só o papel.");
  }

  const numero = melhor.texto.match(/DAV\D{0,8}(\d{5,})/i)?.[1]
    ?? melhor.texto.match(/\[(\d{5,})\]/)?.[1]
    ?? null;
  const dm = melhor.texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const data = dm ? `${dm[3]}-${dm[2]}-${dm[1]}` : null;

  return { texto: melhor.texto, numero, data };
}
