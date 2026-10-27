"""
Builds the TEMPORARY logo (SPEC 6.6): the name set in Fraunces Bold, outlined to paths.

Run once; outputs are committed in brand/logo/. Replace them with the real NS1 logo files when
they arrive (docs/logo-swap.md). Needs: pip install fonttools brotli

  python scripts/make-temp-wordmark.py apps/web/node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2
"""
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

font = instantiateVariableFont(TTFont(sys.argv[1]), {"wght": 700})
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
hmtx = font["hmtx"]
OUT = Path(__file__).resolve().parent.parent / "brand" / "logo"


def outline(text: str, tracking: int = 0) -> tuple[str, tuple[float, float, float, float]]:
    pen = SVGPathPen(glyphs, ntos=lambda v: str(round(v)))
    bounds = BoundsPen(glyphs)
    x = 0
    for ch in text:
        name = cmap[ord(ch)]
        # Flip y (font units go up, SVG goes down).
        glyphs[name].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
        glyphs[name].draw(TransformPen(bounds, (1, 0, 0, -1, x, 0)))
        x += hmtx[name][0] + tracking
    return pen.getCommands(), bounds.bounds


def write(name: str, text: str, fill: str, title: str, pad: int = 40, square: bool = False) -> None:
    d, (x0, y0, x1, y1) = outline(text)
    w, h = x1 - x0 + 2 * pad, y1 - y0 + 2 * pad
    if square:
        # Centered in a square so it reads as an app icon and a 16 px favicon.
        size = max(w, h)
        x0, y0 = x0 - (size - w) / 2, y0 - (size - h) / 2
        w = h = size
    vb = f"{round(x0 - pad)} {round(y0 - pad)} {round(w)} {round(h)}"
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">'
        f"<title>{title}</title>"
        f'<path fill="{fill}" d="{d}"/></svg>\n'
    )
    (OUT / name).write_text(svg)


TITLE = "The NS1 Gallery (temporary wordmark)"
write("wordmark.svg", "The NS1 Gallery", "currentColor", TITLE)
write("wordmark-light.svg", "The NS1 Gallery", "#FFFFFF", TITLE)
write("mark.svg", "NS1", "currentColor", "NS1 (temporary mark)", pad=80, square=True)
print("wrote", *sorted(p.name for p in OUT.glob("*.svg")))
