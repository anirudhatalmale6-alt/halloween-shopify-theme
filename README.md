# Hollow & Hex — Shopify theme

A Shopify Online Store 2.0 theme for a Halloween store. Every product gets its
own landing page automatically, built for cold traffic from paid ads.

No frameworks and no build step — plain Liquid, one stylesheet, one script.

## What you get

**A homepage** built to convert:

- A hero with five real product photographs beside the offer, so the answer to
  "what does this shop sell" is visible before a word is read. Any of the five
  can be swapped in the theme editor.
- An oversized "Shop the Collection" button as the single main call to action.
- A live countdown to October 31st that rolls over by itself each year.
- A trust bar.
- Six category tiles that **scroll down this page** rather than loading a
  separate one.
- A sticky category jump bar that follows you down, with the category you are
  currently in highlighted.
- **One product section per category**, each with its own heading, count and
  anchor. A category with no products removes itself, and anything pointing at
  it hides rather than becoming a link to nowhere.
- A reasons-to-buy block, a reviews section with room for customer photos and
  video, an email capture that writes real Shopify customers, and an FAQ.

Every one of those is a section you can reorder, edit or delete in the theme
editor without touching code.

**A landing page for every product**, generated from the one template:

- Gallery with thumbnails
- Buy box: title, star rating linked to the reviews, price, compare-at price,
  savings badge, units sold
- Benefit bullets
- Variant picker (size, colour, whatever you set up)
- Quantity stepper
- **Add to Cart and Buy It Now.** Buy It Now adds the item and goes straight to
  checkout. It is a plain button rather than Shopify's dynamic checkout button
  on purpose: the dynamic one only appears when accelerated checkout is enabled
  AND the shopper's browser offers a wallet, so on a new store it is often
  simply absent. Shop Pay and PayPal can be switched on underneath it.
- Low-stock bar, which only appears when Shopify is genuinely tracking that
  variant's inventory, so it can never show a number you cannot back up
- Feature cards, specification table, what's-in-the-box
- Related products
- FAQ
- A sticky buy bar on mobile that follows the shopper down the page

**A real cart.** Slide-out drawer, quantity changes, remove, live subtotal, and
Shopify's own secure checkout. Also collection pages, search, a cart page,
customer accounts, a gift-card page, a 404 and a password page.

## Your products are in the box

`products-import.csv` holds all 52 products from the links you sent - names,
descriptions, three benefit bullets each, categories and 54 supplier photos.
One import creates the lot.

**22 have a verified price**, each read off the supplier's own pages and then
checked against a second, independent source. **15 are products the supplier no
longer lists** — they import as drafts so they cannot go on sale by accident.
**15 need a price from you.**

**32 carry a real star rating and review count** — 13,965 reviews between them,
all read off the supplier's own listing for that exact product. The other 20
have no rating and the theme shows no stars for them. There is no fallback
rating: the setting that would invent one is off, and labelled for what it is.

Fill the price column in before importing — a blank price imports as $0.00,
which looks like a working price.

See `SETUP.md` step 4.

## Product content is optional

The landing page is built so a product with **nothing but a title, a price, a
photo and a description** still produces a complete page. Bullets fall back to
sentences from the description, and any section with no content is hidden
rather than left empty.

Written detail is an upgrade, never a thing that blocks you from launching.
Fill the metafields in later, product by product, and each page gets richer on
its own. See `SETUP.md` for the optional fields.

## One place for the delivery promises

Every shipping time, dispatch claim, delivery guarantee, returns promise and
urgency line is in **Theme settings → Shipping & guarantees**. Change one line
there and it changes on the homepage, in the announcement bar, on all 52
product pages and in the cart at once.

Those are the claims that get a store in trouble when they go stale, so they
are the ones that must be trivial to correct the day a supplier changes.
Nothing in them is enforced by the theme — if you promise 24-hour dispatch,
that promise is yours to keep.

## Editing

Everything a shop owner normally changes is in the theme editor under
**Online Store → Themes → Customize**:

- **Colours** — nine settings drive the entire store. Change the accent once
  and every button, badge, link and star follows.
- **Logo** — upload an image, or leave it empty to use the drawn pumpkin with
  your shop name.
- **Sections** — add, remove, reorder, and edit the text on all of them.
- **Cart** — slide-out drawer or a straight trip to the cart page.

## Files

    layout/theme.liquid          the page shell
    layout/password.liquid       shell for the coming-soon page
    templates/*.json             which sections each page type uses
    templates/customers/*        account pages
    sections/*.liquid            every block of the store
    snippets/*.liquid            reused pieces (product card, stars, cart lines)
    config/settings_schema.json  what appears in the theme editor
    assets/theme.css             all styling; colours are variables at the top
    assets/theme.js              cart, gallery, variants, countdown, menu
    assets/*.woff2               self-hosted fonts

## Notes on how it is built

**One description of a cart line.** The cart drawer and the cart page render
from the same snippet, and after any change the theme re-fetches that section
from Shopify and swaps it in. There is no second copy of the cart in
JavaScript, because two copies drift apart.

**Fonts are self-hosted**, not pulled from Google. That removes a
render-blocking request to a third party, and it means the store still looks
right in countries where Google Fonts is blocked.

**Structured data is deliberate.** Products emit JSON-LD for Google, but the
`aggregateRating` is only included when a reviews app has supplied a real
count. The star rating on the page falls back to a default for products with no
reviews yet; putting that default into structured data would be telling Google
about ratings that do not exist, which is how a domain loses rich results.

**Discounts round down.** $49.99 against $79.99 is 37.5% off, and rounding
would advertise it as 38%. A saving is always rounded down.

## Verified

Checked with Shopify's own `theme-check` linter (no errors, no warnings), and
rendered with the Liquid engine against a mock storefront covering the awkward
cases: a product with every field filled, one with real variants, one sold out,
one with no image, and one with no extra content at all.

The rendered pages were then measured in Chromium at 1440, 1280, 1024, 860, 640
and 390 px: no horizontal overflow, no distorted or broken images, no
JavaScript errors, and the gallery, variant switcher, quantity stepper, sticky
bar, menu and cart drawer all confirmed working.
