#!/usr/bin/env python3
"""Genera los assets visuales de Modelito a partir de las hojas creadas en Google Flow (carpeta design/).

    python3 design/build-assets.py        # requiere Pillow y numpy

Entradas  (design/): mascot.jpg  flow-empties.jpg  flow-weather.jpg  flow-feel.jpg  flow-stickers.jpg
Salidas:
  public/            iconos de la PWA (192, 512, maskable, apple-touch, favicon) e imagen para compartir (og-image.jpg)
  src/assets/art/        ilustraciones de pantallas vacías y de «Así funciona»
  src/assets/weather/    8 estados del tiempo
  src/assets/feel/       frío / perfecto / calor
  src/assets/stickers/   pegatinas sueltas con transparencia (fondo magenta eliminado)
"""
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / "design"
PUB = ROOT / "public"
ASSETS = ROOT / "src" / "assets"
FONT_BOLD = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"

INK = (42, 30, 74)
CREAM = (255, 246, 229)

# Orden de lectura (izquierda→derecha, arriba→abajo) de cada hoja
EMPTIES = ["hoy", "historial", "paso-foto", "paso-tiempo", "paso-valora", "bienvenida"]  # 3×2
WEATHER = ["clear", "partly", "cloudy", "fog", "rain", "showers", "snow", "storm"]  # 4×2
FEEL = ["cold", "ok", "hot"]  # 3×1
STICKERS = [
    "hanger", "socks", "cap", "umbrella",
    "sun", "heart", "star", "sparkle",
    "sneaker", "sunglasses", "scarf", "cloud",
]  # 4×3


# ───────────────────────── utilidades ─────────────────────────

def runs(profile: np.ndarray, min_len: int) -> list[tuple[int, int]]:
    """Tramos consecutivos True de un perfil 1D: (inicio, fin) de cada baldosa."""
    out, start = [], None
    for i, on in enumerate(profile):
        if on and start is None:
            start = i
        elif not on and start is not None:
            if i - start >= min_len:
                out.append((start, i))
            start = None
    if start is not None and len(profile) - start >= min_len:
        out.append((start, len(profile)))
    return out


def grid_cells(mask: np.ndarray, cols: int, rows: int, min_len: int, thr: float) -> list[tuple[int, int, int, int]]:
    """Baldosas (x0, y0, x1, y1) de una máscara booleana «hay contenido», en orden de lectura."""
    xs = runs(mask.mean(axis=0) > thr, min_len)
    ys = runs(mask.mean(axis=1) > thr, min_len)
    if len(xs) != cols or len(ys) != rows:
        raise SystemExit(f"Se esperaban {cols}×{rows} baldosas y se detectaron {len(xs)}×{len(ys)}")
    return [(x0, y0, x1, y1) for (y0, y1) in ys for (x0, x1) in xs]


def white_sheet_tiles(path: Path, cols: int, rows: int, inset: int = 3) -> list[Image.Image]:
    """Recorta las baldosas de color de una hoja sobre fondo blanco."""
    img = Image.open(path).convert("RGB")
    content = np.asarray(img).min(axis=2) < 235
    return [img.crop((x0 + inset, y0 + inset, x1 - inset, y1 - inset)) for x0, y0, x1, y1 in grid_cells(content, cols, rows, 40, 0.15)]


def rounded(img: Image.Image, radius_ratio: float) -> Image.Image:
    """RGBA con esquinas redondeadas transparentes (suavizadas por supersampling)."""
    size, scale = img.size, 4
    mask = Image.new("L", (size[0] * scale, size[1] * scale), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size[0] * scale - 1, size[1] * scale - 1), radius=int(min(size) * radius_ratio * scale), fill=255
    )
    out = img.convert("RGBA")
    out.putalpha(mask.resize(size, Image.LANCZOS))
    return out


def save_webp(img: Image.Image, path: Path, quality: int = 86) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=quality, alpha_quality=100, method=6)


def key_magenta(img: Image.Image) -> Image.Image:
    """Quita el fondo magenta liso (#ff00ff): transparencia progresiva y corrección del tinte en los bordes."""
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (np.minimum(r, b) - g) / 255.0  # ≈1 en magenta puro, ≈0 en blanco/gris, <0 en rojos, naranjas, verdes…
    # Más de un 60 % de magenta cuenta como fondo (también las sombras suaves, que se recrean con CSS).
    t = np.clip(m, 0.0, 0.6)
    alpha = 1.0 - np.clip((m - 0.12) / 0.48, 0.0, 1.0)
    # En el borde (mezcla de blanco y magenta) se resta el magenta para no dejar halo rosa.
    k = np.array([255.0, 0.0, 255.0])
    edge = (m > 0.12)[..., None]
    rgb = np.where(edge, (a - t[..., None] * k) / (1.0 - t[..., None]), a)
    alpha = np.where(alpha < 0.05, 0.0, alpha)
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8), "RGBA")


def trim(img: Image.Image, pad: int = 6) -> Image.Image:
    box = img.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
    if not box:
        return img
    x0, y0, x1, y1 = box
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))


def fit(img: Image.Image, max_side: int) -> Image.Image:
    scale = max_side / max(img.size)
    return img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)


# ───────────────────────── iconos PWA ─────────────────────────

def build_icons() -> None:
    src = Image.open(DESIGN / "mascot.jpg").convert("RGB")  # 1024×1024, degradado a sangre con la mascota centrada

    # Sin cuantizar a paleta: el degradado se ve a rayas con 256 colores.
    for size in (512, 192):
        rounded(src.resize((size, size), Image.LANCZOS), 0.2).save(PUB / f"icon-{size}.png", optimize=True)

    # Maskable: la mascota debe caber en el círculo seguro (80 %). Se reduce y el degradado se prolonga
    # replicando el borde (es suave, así que no se nota la unión).
    inner_px, full = 800, 1024
    pad = (full - inner_px) // 2
    inner = np.asarray(src.resize((inner_px, inner_px), Image.LANCZOS))
    maskable = Image.fromarray(np.pad(inner, ((pad, pad), (pad, pad), (0, 0)), mode="edge"))
    maskable.resize((512, 512), Image.LANCZOS).save(PUB / "icon-512-maskable.png", optimize=True)

    src.resize((180, 180), Image.LANCZOS).save(PUB / "apple-touch-icon.png", optimize=True)
    # El favicon es diminuto: solo la camiseta, sin el sol ni los destellos.
    face = src.crop((170, 150, 880, 860)).resize((96, 96), Image.LANCZOS)
    rounded(face, 0.22).save(PUB / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])


# ───────────────────────── ilustraciones ─────────────────────────

def build_art() -> None:
    for name, tile in zip(EMPTIES, white_sheet_tiles(DESIGN / "flow-empties.jpg", 3, 2)):
        save_webp(rounded(tile.resize((360, 360), Image.LANCZOS), 0.17), ASSETS / "art" / f"{name}.webp")


def build_weather() -> None:
    for name, tile in zip(WEATHER, white_sheet_tiles(DESIGN / "flow-weather.jpg", 4, 2)):
        save_webp(rounded(tile.resize((192, 192), Image.LANCZOS), 0.2), ASSETS / "weather" / f"{name}.webp")


def build_feel() -> None:
    for name, tile in zip(FEEL, white_sheet_tiles(DESIGN / "flow-feel.jpg", 3, 1)):
        save_webp(rounded(tile.resize((192, 192), Image.LANCZOS), 0.2), ASSETS / "feel" / f"{name}.webp")


def build_stickers() -> list[Image.Image]:
    sheet = Image.open(DESIGN / "flow-stickers.jpg").convert("RGB")
    px = np.asarray(sheet).astype(np.int16)
    content = ~((np.minimum(px[..., 0], px[..., 2]) - px[..., 1]) > 100)  # todo lo que no es magenta
    out = []
    for name, (x0, y0, x1, y1) in zip(STICKERS, grid_cells(content, 4, 3, 60, 0.05)):
        cut = fit(trim(key_magenta(sheet.crop((x0, y0, x1, y1)))), 192)
        save_webp(cut, ASSETS / "stickers" / f"{name}.webp", quality=90)
        out.append(cut)
    return out


# ───────────────────────── imagen para compartir ─────────────────────────

def build_share(stickers: list[Image.Image]) -> None:
    w, h = 1200, 630
    base = Image.new("RGBA", (w, h), CREAM + (255,))

    # Manchas de color suaves
    blobs = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(blobs)
    for (cx, cy, r, col) in [(80, 60, 300, (79, 195, 247, 120)), (1130, 90, 260, (255, 213, 74, 150)),
                             (1100, 600, 300, (255, 92, 108, 90)), (140, 640, 260, (111, 224, 181, 130))]:
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col)
    base = Image.alpha_composite(base, blobs.filter(ImageFilter.GaussianBlur(90)))

    # Pegatinas repartidas por los bordes
    rnd = random.Random(7)
    # fuera de la zona del texto (x 60–690, y 140–470) y de la tarjeta (x 670–1150)
    spots = [(40, 30, 120), (200, 20, 100), (400, 30, 95), (560, 20, 100), (1090, 40, 100),
             (30, 500, 105), (250, 515, 100), (460, 520, 100), (620, 530, 105), (900, 525, 110), (1090, 500, 100)]
    for (x, y, size), st in zip(spots, rnd.sample(stickers, len(spots))):
        s = fit(st, size).rotate(rnd.uniform(-22, 22), expand=True, resample=Image.BICUBIC)
        base.alpha_composite(s, (x, y))

    # Mascota a la derecha, sobre una tarjeta con el degradado del icono
    card = rounded(Image.open(DESIGN / "mascot.jpg").convert("RGB").resize((430, 430), Image.LANCZOS), 0.2)
    framed = Image.new("RGBA", (card.width + 24, card.height + 24), (0, 0, 0, 0))
    ImageDraw.Draw(framed).rounded_rectangle((0, 0, framed.width - 1, framed.height - 1), radius=92, fill=(255, 255, 255, 255))
    framed.alpha_composite(card, (12, 12))
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shadow.paste((42, 30, 74, 110), (690, 118), framed.getchannel("A"))
    base = Image.alpha_composite(base, shadow.filter(ImageFilter.GaussianBlur(18)))
    base.alpha_composite(framed.rotate(-5, expand=True, resample=Image.BICUBIC), (672, 96))

    # Texto
    draw = ImageDraw.Draw(base)
    draw.text((66, 150), "Modelito", font=ImageFont.truetype(FONT_BOLD, 138), fill=INK)
    for i, line in enumerate(["Qué te pusiste", "en días como hoy"]):
        draw.text((72, 340 + i * 60), line, font=ImageFont.truetype(FONT_BOLD, 44), fill=(110, 100, 144))
    base.convert("RGB").save(PUB / "og-image.jpg", "JPEG", quality=86, optimize=True)


if __name__ == "__main__":
    build_icons()
    build_art()
    build_weather()
    build_feel()
    build_share(build_stickers())
    print("Assets generados.")
