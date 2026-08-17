// Shared helpers for KIDUKI / CASETRA sales decks
const HEAD = "Hiragino Mincho ProN"; // titles (formal serif)
const BODY = "Hiragino Kaku Gothic ProN"; // body

const W = 13.333;
const H = 7.5;
const MX = 0.7; // side margin
const CW = W - MX * 2; // content width

function makeHelpers(pptx, C, footerText) {
  // C: color tokens {INK, MID, TINT, BORDER, MUTED, TEXT, ACCENT}

  function footer(slide, pageNum) {
    slide.addText(footerText, {
      x: MX, y: 7.08, w: 6.5, h: 0.3, fontFace: BODY, fontSize: 8,
      color: C.MUTED, align: "left", valign: "middle", margin: 0,
    });
    slide.addText(String(pageNum).padStart(2, "0"), {
      x: W - MX - 1.0, y: 7.08, w: 1.0, h: 0.3, fontFace: BODY, fontSize: 8,
      color: C.MUTED, align: "right", valign: "middle", margin: 0,
    });
  }

  // Section title + optional lead sentence
  function titleBlock(slide, title, lead) {
    slide.addText(title, {
      x: MX, y: 0.52, w: CW, h: 0.55, fontFace: HEAD, fontSize: 21, bold: true,
      color: C.INK, align: "left", valign: "middle", margin: 0,
    });
    if (lead) {
      slide.addText(lead, {
        x: MX, y: 1.12, w: CW, h: 0.55, fontFace: BODY, fontSize: 11,
        color: C.MUTED, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.25,
      });
    }
  }

  // Rounded card
  function card(slide, x, y, w, h, opts = {}) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w, h, rectRadius: 0.055,
      fill: { color: opts.fill || "FFFFFF" },
      line: opts.noLine ? { type: "none" } : { color: opts.line || C.BORDER, width: 1 },
      shadow: opts.shadow ? { type: "outer", color: "1A2421", opacity: 0.10, blur: 7, offset: 2, angle: 90 } : undefined,
    });
  }

  // Filled numbered circle
  function numCircle(slide, x, y, n, opts = {}) {
    const d = opts.d || 0.34;
    slide.addShape(pptx.ShapeType.ellipse, {
      x, y, w: d, h: d, fill: { color: opts.fill || C.MID }, line: { type: "none" },
    });
    slide.addText(String(n), {
      x: x - 0.1, y: y - 0.03, w: d + 0.2, h: d + 0.06, fontFace: BODY, fontSize: opts.size || 12,
      bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0,
    });
  }

  function text(slide, str, o) {
    slide.addText(str, Object.assign({
      fontFace: BODY, color: C.TEXT, align: "left", valign: "top", margin: 0,
      lineSpacingMultiple: 1.3,
    }, o));
  }

  return { footer, titleBlock, card, numCircle, text };
}

module.exports = { HEAD, BODY, W, H, MX, CW, makeHelpers };
