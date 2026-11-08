import type { Result } from "./quiz";
import { resultHash } from "./quiz";
import { results } from "../data/results";
export type CardFormat = "square" | "story";
export function shareUrl(result: Result) {
  return `${import.meta.env?.VITE_SITE_URL || `${location.origin}${import.meta.env?.BASE_URL || "/"}`}${resultHash(result)}`;
}
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  let line = "";
  for (const word of text.split(" ")) {
    const candidate = `${line}${line ? " " : ""}${word}`;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      line = word;
    } else line = candidate;
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}
export async function resultImage(
  result: Result,
  format: CardFormat,
): Promise<Blob> {
  await document.fonts.ready;
  const info = results[result.category],
    canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = format === "story" ? 1920 : 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const h = canvas.height,
    story = format === "story";
  ctx.fillStyle = info.color;
  ctx.fillRect(0, 0, 1080, h);
  ctx.strokeStyle = `${info.ink}18`;
  ctx.lineWidth = 2;
  for (let x = -500; x < 1500; x += 110) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 700, h);
    ctx.stroke();
  }
  ctx.fillStyle = info.ink;
  ctx.font = "800 30px Manrope Variable, sans-serif";
  ctx.fillText("✳  ТЕСТ НА ПАТРІОТА", 72, 100);
  ctx.textAlign = "right";
  ctx.font = "600 25px Manrope Variable, sans-serif";
  ctx.fillText("ЦЕ ЖАРТ. ВИДИХАЙ.", 1008, 100);
  ctx.textAlign = "left";
  const top = story ? 260 : 95;
  ctx.save();
  ctx.translate(540, top + 140);
  ctx.rotate(-0.09);
  ctx.fillStyle = "#ffffff60";
  ctx.beginPath();
  ctx.roundRect(-170, -160, 340, 320, 64);
  ctx.fill();
  ctx.fillStyle = info.ink;
  ctx.font = '205px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(info.emoji, 0, 75);
  ctx.restore();
  ctx.fillStyle = info.ink;
  ctx.font = "700 25px Manrope Variable, sans-serif";
  ctx.fillText("ТВІЙ ВНУТРІШНІЙ ТИПАЖ", 72, top + 380);
  let titleSize = 106;
  while (titleSize > 52) {
    ctx.font = `800 ${titleSize}px Manrope Variable, sans-serif`;
    if (ctx.measureText(info.name).width <= 936) break;
    titleSize -= 2;
  }
  ctx.fillText(info.name, 72, top + 500);
  ctx.font = "600 37px Manrope Variable, sans-serif";
  wrap(ctx, info.descriptions[result.variant], 72, top + 575, 920, 53);
  const panelY = story ? 1330 : 820;
  ctx.fillStyle = info.ink;
  ctx.beginPath();
  ctx.roundRect(72, panelY, 936, story ? 280 : 125, 30);
  ctx.fill();
  ctx.fillStyle = info.color;
  ctx.font = `800 ${story ? 88 : 63}px Manrope Variable, sans-serif`;
  ctx.fillText(`${result.percent}%`, 105, panelY + (story ? 112 : 83));
  ctx.font = "600 26px Manrope Variable, sans-serif";
  if (story) {
    ctx.fillText("збіг із типажем", 105, panelY + 168);
    ctx.fillText("100% — не науковий діагноз 🙂", 105, panelY + 225);
  } else {
    ctx.fillText("збіг із типажем", 350, panelY + 58);
    ctx.font = "500 22px Manrope Variable, sans-serif";
    ctx.fillText("100% — не науковий діагноз", 350, panelY + 94);
  }
  ctx.fillStyle = info.ink;
  ctx.font = "800 33px Manrope Variable, sans-serif";
  ctx.fillText("А ти хто? Пройди 20 запитань →", 72, h - (story ? 145 : 75));
  const url = import.meta.env?.VITE_SITE_URL;
  if (url) {
    ctx.font = "600 24px Manrope Variable, sans-serif";
    wrap(
      ctx,
      url.replace(/^https?:\/\//, ""),
      72,
      h - (story ? 64 : 34),
      936,
      30,
    );
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG unavailable"))),
      "image/png",
    ),
  );
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function shareResult(
  result: Result,
): Promise<"native" | "copied" | "manual" | "cancelled"> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Я — ${results[result.category].name}!`,
        text: results[result.category].descriptions[result.variant],
        url: shareUrl(result),
      });
      return "native";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError")
        return "cancelled";
    }
  }
  return (await copyText(shareUrl(result))) ? "copied" : "manual";
}
