#!/usr/bin/env python3
"""Genera los iconos de la app (public/) a partir de design/logo.png.

Uso:  python3 design/make-icons.py

- icon-192 / icon-512: esquinas redondeadas con transparencia (mismo estilo que antes).
- icon-512-maskable / apple-touch-icon: full-bleed, sin transparencia.
- favicon.ico: 16/32/48 px.
Todo se guarda en paleta de 256 colores para que los PNG pesen poco.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / 'public'

# El logo original (1254x1254) con el icono centrado; se recorta la tarjeta 868x868.
src = Image.open(ROOT / 'design' / 'logo.png').convert('RGB')
card = src.crop((192, 175, 1060, 1043))


def rounded(img: Image.Image, size: int, radius_ratio: float = 98 / 512) -> Image.Image:
    base = img.resize((size, size), Image.LANCZOS).convert('RGBA')
    S = 4
    mask = Image.new('L', (size * S, size * S), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size * S - 1, size * S - 1], radius=radius_ratio * size * S, fill=255
    )
    base.putalpha(mask.resize((size, size), Image.LANCZOS))
    return base.quantize(colors=256, method=Image.FASTOCTREE)


def flat(img: Image.Image, size: int) -> Image.Image:
    return img.resize((size, size), Image.LANCZOS).quantize(256, dither=Image.FLOYDSTEINBERG)


rounded(card, 192).save(PUB / 'icon-192.png', optimize=True)
rounded(card, 512).save(PUB / 'icon-512.png', optimize=True)
flat(card, 512).save(PUB / 'icon-512-maskable.png', optimize=True)
flat(card, 180).save(PUB / 'apple-touch-icon.png', optimize=True)
rounded(card, 96).save(PUB / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])

print('Iconos generados en', PUB)
