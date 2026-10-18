#!/usr/bin/env python3
"""Renders the app icon: the syllable 한 in black, centered on a white square.

Run once; the PNG files it writes into site/ are committed. iOS does not use
SVG icons, so the icon is provided as PNG at the sizes iOS and the manifest
use. The font is Gugi (scripts/fonts/Gugi-Regular.ttf, SIL Open Font
License), a rounded Hangul face.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT_FILE = ROOT / 'scripts' / 'fonts' / 'Gugi-Regular.ttf'
GLYPH = '한'
GLYPH_HEIGHT = 0.6  # of the square; leaves room for the rounded corners iOS cuts
SITE = ROOT / 'site'
ICONS = {
    'apple-touch-icon.png': 180,
    'icon-192.png': 192,
    'icon-512.png': 512,
}


def render(size):
    image = Image.new('RGB', (size, size), 'white')
    draw = ImageDraw.Draw(image)
    # Scale the font so the glyph's ink is GLYPH_HEIGHT of the square, then
    # center the ink, not the em box.
    font = ImageFont.truetype(FONT_FILE, 100)
    left, top, right, bottom = draw.textbbox((0, 0), GLYPH, font=font)
    font = ImageFont.truetype(FONT_FILE, round(100 * size * GLYPH_HEIGHT / (bottom - top)))
    left, top, right, bottom = draw.textbbox((0, 0), GLYPH, font=font)
    x = (size - (right - left)) / 2 - left
    y = (size - (bottom - top)) / 2 - top
    draw.text((x, y), GLYPH, font=font, fill='black')
    return image


def main():
    font = ImageFont.truetype(FONT_FILE, 10)
    assert font.getname()[0] == 'Gugi', font.getname()
    for name, size in ICONS.items():
        render(size).save(SITE / name, optimize=True)
        print(f'{name}: {size}x{size}')


if __name__ == '__main__':
    main()
