#!/usr/bin/env python3
"""Would re-importing products-import.csv change a price on the live store?

Run this BEFORE every import. Shopify's "Overwrite any current products that
have the same handle" does exactly what it says: it takes the price out of the
spreadsheet and writes it over whatever is on the store. So a price edited in
the Shopify admin and not copied back into prices.csv is silently undone by the
next import, and nothing anywhere says so - the import reports success.

That already happened once here. The Sitting Skeleton Resin Ornament was
re-priced in the admin from $19.09 to $34.99 with a $49.99 compare-at, and the
spreadsheet still said $19.09 with no compare-at. The next import would have
cut a live product's price by 45% and deleted its discount badge.

Run:  python3 pricecheck.py
      python3 pricecheck.py https://your-store.myshopify.com

Exit code is 1 if anything would change, so it can gate a deploy.
"""
import csv
import json
import os
import sys
import urllib.request

STORE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "https://hollowhex.com"
CSV = os.path.join(os.path.dirname(os.path.abspath(__file__)), "products-import.csv")


def cents(v):
    """'24.27' and 24.27 and '' all have to compare as the same kind of thing.

    Shopify hands prices back as strings like '24.27'; the CSV holds strings
    too, but '' and '0.00' and None all mean different things and must not
    collapse into each other. Missing stays None.
    """
    if v in (None, "", "0.00", 0):
        return None
    return round(float(v) * 100)


def live():
    out = {}
    url = f"{STORE}/products.json?limit=250"
    with urllib.request.urlopen(url, timeout=30) as r:
        data = json.load(r)
    for p in data["products"]:
        for v in p["variants"]:
            key = (p["handle"], v.get("title") or "")
            out[key] = (cents(v.get("price")), cents(v.get("compare_at_price")))
    return out


def spreadsheet():
    out = {}
    for r in csv.DictReader(open(CSV, encoding="utf-8")):
        if not r["Option1 Value"]:
            continue                      # image-only row, carries no variant
        title = " / ".join(x for x in (r["Option1 Value"], r["Option2 Value"],
                                       r["Option3 Value"]) if x)
        out[(r["Handle"], title)] = (cents(r["Variant Price"]),
                                     cents(r["Variant Compare At Price"]))
    return out


def money(c):
    return "-" if c is None else f"${c / 100:,.2f}"


def main():
    on_store, in_csv = live(), spreadsheet()
    changes, missing = [], []
    for key, want in sorted(in_csv.items()):
        have = on_store.get(key)
        if have is None:
            # Not on the store: a draft, or a variant this import would create.
            # Not a price change, so not this script's business.
            missing.append(key)
            continue
        if have != want:
            changes.append((key, have, want))

    print(f"store : {STORE}")
    print(f"live variants: {len(on_store)}   csv variants: {len(in_csv)}   "
          f"not yet on the store: {len(missing)}")

    if not changes:
        # A run that finds nothing must still prove it was looking. If the
        # store were unreachable or the handles had all been renamed, the
        # comparison would find nothing to compare and print this same line.
        matched = len(set(in_csv) & set(on_store))
        print(f"\nno price would change. {matched} variants compared and matched.")
        if not matched:
            print("!! but ZERO variants matched by handle - this checked nothing")
            return 1
        return 0

    print(f"\n!! importing this CSV would change {len(changes)} price(s):\n")
    for (handle, title), have, want in changes:
        who = f"{handle} {title}".strip()
        print(f"  {who:46} live {money(have[0]):>9} -> csv {money(want[0]):>9}"
              f"   was {money(have[1]):>9} -> {money(want[1]):>9}")
    print("\nIf the live number is the one you want, copy it into "
          "halloween-demo/prices.csv and re-run make_products_csv.py.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
