#!/usr/bin/env python3
"""Build the Shopify product-import CSV from the same catalogue the store uses.

One source of truth. The landing-page site and this spreadsheet are generated
from catalog.py, so a name fixed in one place is fixed in both and they cannot
drift apart.

Run:  python3 make_products_csv.py
"""
import csv
import os
import sys

DEMO = "/var/lib/freelancer/projects/40609577/halloween-demo"
sys.path.insert(0, DEMO)
import catalog  # noqa: E402

OUT = os.path.dirname(os.path.abspath(__file__))

# Shopify fetches every Image Src at import time and copies it onto its own CDN,
# so these only have to be reachable during the import itself.
#
# They deliberately do NOT point at TikTok. The TikTok CDN URLs carry expiring
# signature parameters (t=, ps=, shp=), so importing from them would work today
# and leave a store full of broken images later. These are served from the
# GitHub Pages site instead, which is stable.
IMG_BASE = "https://anirudhatalmale6-alt.github.io/halloween-store-demo/assets/products"

HEADERS = [
    "Handle", "Title", "Body (HTML)", "Vendor", "Type", "Tags", "Published",
    "Option1 Name", "Option1 Value",
    "Variant SKU", "Variant Inventory Tracker", "Variant Inventory Qty",
    "Variant Inventory Policy", "Variant Fulfillment Service",
    "Variant Price", "Variant Compare At Price",
    "Variant Requires Shipping", "Variant Taxable",
    "Image Src", "Image Position", "Image Alt Text",
    "SEO Title", "SEO Description", "Status",
]


def row(**kw):
    r = {h: "" for h in HEADERS}
    r.update(kw)
    return r


def body_html(p):
    """The description Shopify stores, and the source the theme falls back to.

    The theme derives its benefit bullets from this when no bullets metafield
    is set, so the paragraph goes first and the list second - that ordering is
    what makes the fallback produce a sensible page on its own.
    """
    out = [f"<p>{p['blurb']}</p>"]
    bullets = catalog.BULLETS.get(p["slug"])
    if bullets:
        out.append("<ul>")
        out += [f"<li>{b}</li>" for b in bullets]
        out.append("</ul>")
    return "".join(out)


def image_url(p, i):
    suffix = "" if i == 0 else f"-{i + 1}"
    return f"{IMG_BASE}/{p['slug']}{suffix}.jpg"


def product_rows(p):
    """A product is one row, plus one extra row per additional photo."""
    rows = [row(
        Handle=p["slug"],
        Title=p["name"],
        Vendor="",
        Type=p["cat"],
        Tags=p["cat"],
        Published="TRUE",
        Status="active",
        **{
            "Body (HTML)": body_html(p),
            "Option1 Name": "Title",
            "Option1 Value": "Default Title",
            "Variant SKU": p["slug"].upper()[:32],
            "Variant Inventory Tracker": "shopify",
            "Variant Inventory Qty": 25,
            "Variant Inventory Policy": "deny",
            "Variant Fulfillment Service": "manual",
            # Blank, not 0.00. A zero here imports as a free product and looks
            # like a working price; a blank cell is visibly unfinished.
            "Variant Price": f"{p['price']:.2f}" if p["price"] else "",
            "Variant Compare At Price": f"{p['was']:.2f}" if p["was"] else "",
            "Variant Requires Shipping": "TRUE",
            "Variant Taxable": "TRUE",
            "Image Src": image_url(p, 0) if p["images"] else "",
            "Image Position": "1" if p["images"] else "",
            "Image Alt Text": p["name"],
            "SEO Title": f"{p['name']} | Free US Shipping Before Halloween"[:70],
            "SEO Description": p["blurb"][:320],
        },
    )]
    for i in range(1, len(p["images"])):
        rows.append(row(Handle=p["slug"], **{
            "Image Src": image_url(p, i),
            "Image Position": str(i + 1),
            "Image Alt Text": p["name"],
        }))
    return rows


def main():
    catalog.check()
    rows = []
    for p in catalog.PRODUCTS:
        rows += product_rows(p)

    path = os.path.join(OUT, "products-import.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=HEADERS)
        w.writeheader()
        w.writerows(rows)

    unpriced = [p["slug"] for p in catalog.PRODUCTS if not p["price"]]
    nophoto = [p["slug"] for p in catalog.PRODUCTS if not p["images"]]
    print(f"products-import.csv: {len(catalog.PRODUCTS)} products, {len(rows)} rows")
    print(f"  {len(unpriced)} with no price yet")
    print(f"  {len(nophoto)} with no photo: {nophoto}")


if __name__ == "__main__":
    main()
