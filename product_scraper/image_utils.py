"""Kaynak görselleri site yayını için yeniden boyutlandırma."""

from __future__ import annotations

from io import BytesIO
from pathlib import Path

from PIL import Image


def process_product_image(
    image_bytes: bytes,
    out_path: Path,
    *,
    max_side: int = 2000,
    jpeg_quality: int = 90,
) -> tuple[int, int]:
    """
    Görseli kareye yakın maksimum kenar `max_side` olacak şekilde ölçekler,
    RGBA ise beyaz arka plana composite eder, JPEG olarak kaydeder.
    Dönen değer (width, height).
    """
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(BytesIO(image_bytes)) as im:
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
        else:
            im = im.convert("RGB")
        if im.mode == "RGBA":
            bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[3])
            im = bg
        elif im.mode != "RGB":
            im = im.convert("RGB")

        w, h = im.size
        scale = min(max_side / max(w, h), 1.0)
        if scale < 1.0:
            nw, nh = int(w * scale), int(h * scale)
            im = im.resize((nw, nh), Image.Resampling.LANCZOS)
        else:
            nw, nh = w, h

        im.save(out_path, format="JPEG", quality=jpeg_quality, optimize=True)
        return nw, nh
