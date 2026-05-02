"""Komut satırı: popüler iPhone kılıfları topla, görselleri işle, CSV indir."""

from __future__ import annotations

import argparse
import asyncio
import csv
import re
import sys
from pathlib import Path

import httpx

from product_scraper.image_utils import process_product_image
from product_scraper.scraper import Site, build_search_url, run_scrape


def _slug(s: str, max_len: int = 60) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9\u0400-\u04FF]+", "-", s, flags=re.IGNORECASE)
    s = re.sub(r"-+", "-", s).strip("-")
    if not s:
        s = "urun"
    return s[:max_len].rstrip("-")


def _description_tr(title: str, site: str) -> str:
    base = title.strip() or "iPhone kılıf"
    return (
        f"{base} — Yüksek kaliteli koruma, darbeye dayanıklı yapı. "
        f"Kaynak: {site}. Stok ve renk görsellere göre değişebilir."
    )


async def _download_image(client: httpx.AsyncClient, url: str) -> bytes:
    r = await client.get(url, follow_redirects=True, timeout=60.0)
    r.raise_for_status()
    return r.content


async def main_async(args: argparse.Namespace) -> int:
    site: Site = args.site
    query = args.query.strip()
    if not query:
        print("Hata: arama sorgusu boş olamaz.", file=sys.stderr)
        return 2

    search_url = args.url or build_search_url(site, query)
    out_dir = Path(args.output_dir).resolve()
    images_dir = out_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    print(f"Kaynak: {site} | Sorgu: {query!r} | Adet: {args.limit}")
    print("Sayfa yükleniyor (bu adım 1-2 dakika sürebilir)...")

    products = await run_scrape(
        site,
        search_url,
        limit=args.limit,
        headless=not args.show_browser,
        storage_state_path=args.state or None,
        interactive_pause_sec=args.interactive_seconds,
    )

    if not products:
        print(
            "Hiç ürün bulunamadı. Olası nedenler: captcha, giriş gerekir, veya sayfa "
            "yapısı değişti.\n"
            "  --show-browser --interactive-seconds 120  (captcha/giriş sonrası devam)\n"
            "  --state path/to/state.json  (kayıtlı çerezlerle tekrar dene)\n"
            "Not: AliExpress/Temu otomasyonu kısıtlayabilir; farklı IP / ev ağı deneyin.",
            file=sys.stderr,
        )
        return 1

    csv_path = out_dir / args.csv_name
    fieldnames = [
        "sıra",
        "kaynak",
        "başlık",
        "ürün_linki",
        "görsel_dosyası",
        "görsel_yolu",
        "genişlik",
        "yükseklik",
        "açıklama",
    ]

    async with httpx.AsyncClient(
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
        }
    ) as client:
        rows: list[dict] = []
        for p in products:
            fname = f"{p.source_rank:03d}-{_slug(p.title)}.jpg"
            rel_path = f"images/{fname}"
            abs_img = images_dir / fname
            try:
                raw = await _download_image(client, p.image_url)
                w, h = process_product_image(
                    raw,
                    abs_img,
                    max_side=args.max_side,
                    jpeg_quality=args.jpeg_quality,
                )
            except Exception as e:
                print(f"Atlandı (görsel hatası) #{p.source_rank}: {e}", file=sys.stderr)
                continue
            rows.append(
                {
                    "sıra": p.source_rank,
                    "kaynak": site,
                    "başlık": p.title,
                    "ürün_linki": p.url,
                    "görsel_dosyası": fname,
                    "görsel_yolu": rel_path,
                    "genişlik": w,
                    "yükseklik": h,
                    "açıklama": _description_tr(p.title, site),
                }
            )

    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)

    print(f"Tamamlandı: {len(rows)} satır → {csv_path}")
    print(f"Görseller: {images_dir}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description=(
            "AliExpress (çok satılan sıra) veya Temu aramasından iPhone kılıf "
            "ürünlerini çeker, görselleri siteye uygun JPEG yapar, CSV + klasör üretir."
        )
    )
    p.add_argument(
        "query",
        nargs="?",
        default="iphone case",
        help='Arama metni (varsayılan: "iphone case")',
    )
    p.add_argument(
        "--site",
        choices=("aliexpress", "temu"),
        default="aliexpress",
        help="Kaynak site (AliExpress: çok satılan sıralaması)",
    )
    p.add_argument(
        "--limit",
        type=int,
        default=20,
        help="En fazla kaç ürün (varsayılan 20)",
    )
    p.add_argument(
        "--output-dir",
        "-o",
        default="export_iphone_cases",
        help="Çıktı klasörü (CSV + images/)",
    )
    p.add_argument(
        "--csv-name",
        default="urunler.csv",
        help="CSV dosya adı",
    )
    p.add_argument(
        "--url",
        default="",
        help="Özel arama URL’si (verilirse --site sadece etiket için kullanılır)",
    )
    p.add_argument(
        "--max-side",
        type=int,
        default=2000,
        help="Görsel maksimum kenar (px)",
    )
    p.add_argument(
        "--jpeg-quality",
        type=int,
        default=90,
        help="JPEG kalitesi 1-95",
    )
    p.add_argument(
        "--show-browser",
        action="store_true",
        help="Tarayıcıyı görünür çalıştır (captcha için gerekli)",
    )
    p.add_argument(
        "--interactive-seconds",
        type=int,
        default=0,
        metavar="N",
        help=(
            "Görünür modda N saniye bekle (captcha / girişi tamamlayın; "
            "0 = bekleme yok)"
        ),
    )
    p.add_argument(
        "--state",
        default="",
        metavar="JSON",
        help="Playwright storage state dosyası (çerezleri kaydet / yükle)",
    )
    return p


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    rc = asyncio.run(main_async(args))
    raise SystemExit(rc)


if __name__ == "__main__":
    main()
