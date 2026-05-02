"""Playwright ile listeleme sayfalarından ürün bilgisi çıkarma."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Literal
from pathlib import Path

from playwright.async_api import async_playwright, Page


Site = Literal["aliexpress", "temu"]


@dataclass
class RawProduct:
    title: str
    url: str
    image_url: str
    source_rank: int


def _search_url_aliexpress(query: str) -> str:
    q = quote_plus(query)
    # total_tranpro_desc: çok satılan sıralaması
    return (
        f"https://www.aliexpress.com/wholesale?SearchText={q}"
        "&sortType=total_tranpro_desc"
    )


def _search_url_temu(query: str) -> str:
    q = quote_plus(query)
    return f"https://www.temu.com/search_result.html?search_key={q}"


def build_search_url(site: Site, query: str) -> str:
    if site == "aliexpress":
        return _search_url_aliexpress(query)
    return _search_url_temu(query)


def _normalize_img(url: str) -> str:
    if not url:
        return ""
    if url.startswith("//"):
        return "https:" + url
    return url


async def _scroll_page(page: Page, rounds: int = 4) -> None:
    for _ in range(rounds):
        await page.evaluate("window.scrollBy(0, document.body.scrollHeight)")
        await asyncio.sleep(0.8)


async def scrape_listing(
    page: Page,
    site: Site,
    search_url: str,
    limit: int,
    *,
    skip_goto: bool = False,
) -> list[RawProduct]:
    if not skip_goto:
        await page.goto(search_url, wait_until="domcontentloaded", timeout=90_000)
    await page.wait_for_timeout(3000)
    await _scroll_page(page)

    data = await page.evaluate(
        """([site, limit]) => {
          const out = [];
          const seen = new Set();

          const imgUrlFrom = (img) => {
            if (!img) return "";
            return (
              img.getAttribute("src") ||
              img.getAttribute("data-src") ||
              img.getAttribute("data-ks-lazyload") ||
              img.getAttribute("data-lazy") ||
              ""
            );
          };

          const push = (url, imageUrl, title) => {
            if (!url || !imageUrl) return;
            let u = url;
            if (u.startsWith("//")) u = "https:" + u;
            if (!u.startsWith("http")) return;
            if (seen.has(u)) return;
            seen.add(u);
            let src = imageUrl;
            if (src.startsWith("//")) src = "https:" + src;
            out.push({
              url: u,
              imageUrl: src,
              title: (title || "").trim().slice(0, 800)
            });
            return out.length >= limit;
          };

          if (site === "aliexpress") {
            const nodes = document.querySelectorAll('a[href*="/item/"]');
            nodes.forEach((a) => {
              if (out.length >= limit) return;
              const href = a.getAttribute("href");
              if (!href || href.includes("javascript")) return;
              const full = a.href;
              let img = a.querySelector("img");
              if (!img) {
                const card =
                  a.closest("[data-pl='product']") ||
                  a.closest("[data-pl=product]") ||
                  a.parentElement;
                if (card) img = card.querySelector("img");
              }
              const title =
                (img && img.alt) ||
                a.getAttribute("title") ||
                (a.textContent || "").trim().slice(0, 200);
              const imageUrl = imgUrlFrom(img);
              if (imageUrl) push(full, imageUrl, title);
            });
          } else {
            document.querySelectorAll("a[href]").forEach((a) => {
              if (out.length >= limit) return;
              const href = a.getAttribute("href") || "";
              if (!href.includes("goods.html") && !href.includes("/item/")) return;
              const full = a.href;
              let img = a.querySelector("img");
              if (!img) {
                const card = a.closest("[role='article']") || a.parentElement;
                if (card) img = card.querySelector("img");
              }
              const title =
                (img && img.alt) ||
                a.getAttribute("aria-label") ||
                (a.textContent || "").trim().slice(0, 200);
              const imageUrl = imgUrlFrom(img);
              if (imageUrl) push(full, imageUrl, title);
            });
          }

          return out.slice(0, limit);
        }""",
        [site, limit],
    )

    products: list[RawProduct] = []
    for i, row in enumerate(data):
        products.append(
            RawProduct(
                title=row.get("title") or f"product_{i+1}",
                url=row["url"],
                image_url=_normalize_img(row["imageUrl"]),
                source_rank=i + 1,
            )
        )
    return products


async def run_scrape(
    site: Site,
    search_url: str,
    limit: int,
    *,
    headless: bool = True,
    storage_state_path: str | None = None,
    interactive_pause_sec: int = 0,
) -> list[RawProduct]:
    state = None
    if storage_state_path and Path(storage_state_path).is_file():
        state = storage_state_path

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        try:
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                ),
                locale="en-US",
                storage_state=state,
            )
            page = await context.new_page()
            if interactive_pause_sec > 0 and not headless:
                await page.goto(
                    search_url, wait_until="domcontentloaded", timeout=90_000
                )
                print(
                    f"Etkileşimli bekleme: {interactive_pause_sec} sn — "
                    "captcha veya girişi tamamlayın; süre bitince ürünler toplanır.",
                    flush=True,
                )
                await page.wait_for_timeout(interactive_pause_sec * 1000)
                products = await scrape_listing(
                    page,
                    site,
                    page.url,
                    limit,
                    skip_goto=True,
                )
            else:
                products = await scrape_listing(page, site, search_url, limit)
            if storage_state_path:
                await context.storage_state(path=storage_state_path)
            return products
        finally:
            await browser.close()
