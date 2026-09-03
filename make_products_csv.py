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
import build  # noqa: E402

# catalog.py carries price=None for every product; the prices live in
# prices.csv and are overlaid at build time. Without this the export writes a
# spreadsheet with every price blank while reporting itself as fine - the same
# trap the page audit fell into, from the same cause.
build.load_prices()
# Ratings and review counts live in social.csv, and they are exported as
# Shopify metafields so the theme's star rows have something real to read.
build.load_social()

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
    # Shopify's product importer writes metafields when the column is named
    # exactly like this. `reviews.rating` / `reviews.rating_count` is the
    # standard namespace every reviews app reads and writes, so a real reviews
    # app installed later takes these over instead of fighting them.
    #
    # The rating type is `rating`, whose value is a JSON object carrying its
    # own scale. A bare "4.5" in this column imports as nothing at all - it
    # does not error, the field is simply empty afterwards.
    "Product Metafield: reviews.rating [rating]",
    "Product Metafield: reviews.rating_count [number_integer]",
    "Product Metafield: custom.sold_count [number_integer]",
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
    """The filename is read out of the list, never computed from the index.

    Deriving `slug-3.jpg` from position 3 holds only while the positions run
    1..n with no holes. Delete one row from the middle of photos.csv and every
    name after the hole points at a file that is not there - which on a Shopify
    import is worse than on the site, because the importer just skips the image
    and the product lands with a gap nobody is told about.
    """
    name = str(p["images"][i])
    if not name.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        name = f"{p['slug']}.jpg" if i == 0 else f"{p['slug']}-{i + 1}.jpg"
    return f"{IMG_BASE}/{name}"


def product_rows(p):
    """A product is one row, plus one extra row per additional photo.

    Products the supplier has stopped listing import as DRAFTS. They still
    arrive - photos, copy, the lot - so nothing has to be rebuilt if they come
    back, but they cannot be bought until the client publishes them himself.
    Importing them as active would put fifteen unfulfillable products on a live
    storefront the moment the file is uploaded.
    """
    gone = p["slug"] in catalog.UNAVAILABLE
    # A rating is only written when the supplier published one. No fallback,
    # no default - a product with no reviews imports with an empty metafield
    # and the theme then renders no stars at all for it.
    rating = ""
    if p.get("rating"):
        rating = ('{"scale_min":"1.0","scale_max":"5.0","value":"'
                  + f'{p["rating"]:.1f}' + '"}')
    rows = [row(
        Handle=p["slug"],
        Title=p["name"],
        Vendor="",
        Type=p["cat"],
        Tags=p["cat"] + (", unavailable-at-supplier" if gone else ""),
        Published="FALSE" if gone else "TRUE",
        Status="draft" if gone else "active",
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
            "Product Metafield: reviews.rating [rating]": rating,
            "Product Metafield: reviews.rating_count [number_integer]":
                str(p["reviews"]) if p.get("reviews") else "",
            "Product Metafield: custom.sold_count [number_integer]":
                str(p["sold"]) if p.get("sold") else "",
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
    rated = [p for p in catalog.PRODUCTS if p.get("rating")]
    print(f"  {len(nophoto)} with no photo: {nophoto}")
    print(f"  {len(rated)} carrying a real supplier rating "
          f"({sum(p.get('reviews') or 0 for p in rated):,} reviews in total)")


if __name__ == "__main__":
    main()
