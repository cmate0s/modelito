#!/usr/bin/env python3
"""Genera los assets visuales de Modelito (estilo «atelier»).

    python3 design/build-assets.py        # requiere Pillow, numpy y fonttools+brotli; haber hecho `npm install`

Entrada  (design/): atelier-lineart.jpg  hoja de 6 bocetos de moda en línea fina (3×2) creada en Google Flow
Fuentes: Cormorant Garamond y Manrope, tomadas de node_modules (@fontsource-variable).
Salidas:
  public/            iconos de la PWA (192, 512, maskable, apple-touch, favicon) e imagen para compartir (og-image.jpg)
  src/assets/art/    bocetos recortados con solo canal alfa: la app los tiñe con el color del texto (CSS mask)
"""
import tempfile
from pathlib import Path

import numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / "design"
PUB = ROOT / "public"
ART = ROOT / "src" / "assets" / "art"
FONTS = ROOT / "node_modules" / "@fontsource-variable"

INK = (27, 25, 23)
IVORY = (246, 242, 236)
CAMEL = (164, 125, 82)
MUTED = (111, 102, 92)
LINE = (201, 192, 177)

# Orden de lectura de la hoja 3×2, y cuáles se usan dentro de la app
SHEET = ["blazer", "sweater", "boot", "bag", "trench", "sunglasses"]
IN_APP = ["blazer", "sweater", "trench", "sunglasses"]


# ───────────────────────── tipografía ─────────────────────────

_ttf_cache: dict[str, str] = {}


def font(family: str, style: str, size: int, wght: int) -> ImageFont.FreeTypeFont:
    """Carga una fuente variable de @fontsource-variable (woff2 → ttf temporal) fijando el peso."""
    src = FONTS / family / "files" / f"{family}-latin-wght-{style}.woff2"
    if str(src) not in _ttf_cache:
        out = Path(tempfile.mkdtemp()) / f"{family}-{style}.ttf"
        f = TTFont(str(src))
        f.flavor = None
        f.save(str(out))
        _ttf_cache[str(src)] = str(out)
    ft = ImageFont.truetype(_ttf_cache[str(src)], size)
    ft.set_variation_by_axes([wght])
    return ft


def spaced(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, ft: ImageFont.FreeTypeFont, fill, tracking: float) -> None:
    """Texto con espaciado entre letras (Pillow no lo trae)."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=ft, fill=fill)
        x += draw.textlength(ch, font=ft) + tracking


def centered(draw: ImageDraw.ImageDraw, center: tuple[float, float], text: str, ft: ImageFont.FreeTypeFont, fill) -> None:
    """Centra el texto por su caja visible (no por el avance tipográfico)."""
    l, t, r, b = draw.textbbox((0, 0), text, font=ft)
    draw.text((center[0] - (l + r) / 2, center[1] - (t + b) / 2), text, font=ft, fill=fill)


# ───────────────────────── bocetos ─────────────────────────

def ink_alpha(gray: np.ndarray) -> np.ndarray:
    """Luminancia → opacidad de tinta. Se refuerza un poco el trazo para que aguante al reducirlo."""
    ink = 1.0 - gray.astype(np.float32) / 255.0
    return np.clip((ink - 0.05) * 1.7, 0.0, 1.0)


def sketch_tiles() -> dict[str, Image.Image]:
    """Recorta cada boceto de la hoja como RGBA negro con el trazo en el canal alfa, ajustado a su caja."""
    sheet = Image.open(DESIGN / "atelier-lineart.jpg").convert("L")
    w, h = sheet.size
    tiles = {}
    for i, name in enumerate(SHEET):
        c, r = i % 3, i // 3
        cell = np.asarray(sheet.crop((c * w // 3, r * h // 2, (c + 1) * w // 3, (r + 1) * h // 2)))
        a = ink_alpha(cell)
        ys, xs = np.where(a > 0.25)
        if len(xs) == 0:
            raise SystemExit(f"No se encontró dibujo en la celda «{name}»")
        a = a[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
        rgba = np.dstack([np.zeros(a.shape + (3,), np.uint8), (a * 255).astype(np.uint8)])
        tiles[name] = Image.fromarray(rgba, "RGBA")
    return tiles


def square(img: Image.Image, side: int, pad: float = 0.06) -> Image.Image:
    """Centra el dibujo en un lienzo cuadrado transparente, con un margen proporcional."""
    inner = round(side * (1 - 2 * pad))
    scale = inner / max(img.size)
    img = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)
    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    out.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return out


def build_art(tiles: dict[str, Image.Image]) -> None:
    ART.mkdir(parents=True, exist_ok=True)
    for old in ART.glob("*.webp"):
        old.unlink()
    for name in IN_APP:
        square(tiles[name], 400).save(ART / f"{name}.webp", "WEBP", quality=92, alpha_quality=100, method=6)


def tinted(img: Image.Image, color: tuple[int, int, int]) -> Image.Image:
    solid = Image.new("RGBA", img.size, color + (255,))
    solid.putalpha(img.getchannel("A"))
    return solid


# ───────────────────────── iconos PWA ─────────────────────────

def monogram(size: int = 1024, frame: bool = True) -> Image.Image:
    """«M» de Cormorant en marfil sobre tinta, con un filete fino de camel, como la etiqueta de una prenda."""
    scale = 2  # supermuestreo
    s = size * scale
    img = Image.new("RGB", (s, s), INK)
    d = ImageDraw.Draw(img)
    if frame:
        inset, lw = round(s * 0.227), max(2, round(s * 0.0035))
        d.rectangle((inset, inset, s - inset, s - inset), outline=CAMEL, width=lw)
    centered(d, (s / 2, s / 2 + s * 0.012), "M", font("cormorant-garamond", "normal", round(s * 0.5), 500), IVORY)
    return img.resize((size, size), Image.LANCZOS)


def rounded(img: Image.Image, ratio: float) -> Image.Image:
    size, k = img.size, 4
    mask = Image.new("L", (size[0] * k, size[1] * k), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] * k - 1, size[1] * k - 1), radius=int(min(size) * ratio * k), fill=255)
    out = img.convert("RGBA")
    out.putalpha(mask.resize(size, Image.LANCZOS))
    return out


def build_icons() -> None:
    full = monogram(1024)  # el filete queda dentro del círculo seguro (80 %), así que sirve también como maskable
    for px in (512, 192):
        rounded(full.resize((px, px), Image.LANCZOS), 0.2).save(PUB / f"icon-{px}.png", optimize=True)
    full.resize((512, 512), Image.LANCZOS).save(PUB / "icon-512-maskable.png", optimize=True)
    full.resize((180, 180), Image.LANCZOS).save(PUB / "apple-touch-icon.png", optimize=True)
    # Favicon: solo la M, sin filete, más grande para que se lea a 16 px
    small = monogram(96, frame=False)
    rounded(small, 0.18).save(PUB / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])


# ───────────────────────── imagen para compartir ─────────────────────────

def build_share(tiles: dict[str, Image.Image]) -> None:
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), IVORY)
    d = ImageDraw.Draw(img)
    d.rectangle((28, 28, w - 28, h - 28), outline=LINE, width=2)

    # Dos bocetos a la derecha
    for name, x, height in (("blazer", 735, 380), ("trench", 940, 420)):
        t = tiles[name]
        t = t.resize((round(t.width * height / t.height), height), Image.LANCZOS)
        img.paste(tinted(t, INK), (x, (h - height) // 2), tinted(t, INK))

    spaced(d, (84, 150), "DIARIO DE OUTFITS CON EL TIEMPO", font("manrope", "normal", 19, 600), CAMEL, 4.2)
    d.text((78, 198), "Modelito", font=font("cormorant-garamond", "normal", 156, 500), fill=INK)
    for i, line in enumerate(["Qué te pusiste", "en días como hoy"]):
        d.text((84, 392 + i * 64), line, font=font("cormorant-garamond", "italic", 52, 500), fill=MUTED)
    img.save(PUB / "og-image.jpg", "JPEG", quality=90, optimize=True)


if __name__ == "__main__":
    tiles = sketch_tiles()
    build_art(tiles)
    build_icons()
    build_share(tiles)
    print("Assets generados.")
