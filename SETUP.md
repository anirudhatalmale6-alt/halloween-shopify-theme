# Setting the store up

Written to be followed start to finish. Nothing here needs any code.

---

## 1. Create the Shopify store

Go to shopify.com and start the trial. Pick any store name — you can change it,
and you can attach your own domain later.

---

## 2. Upload the theme

1. Download `hollow-and-hex-theme.zip`.
2. In Shopify admin: **Online Store → Themes**.
3. Scroll to the bottom, **Add theme → Upload zip file**.
4. Choose the zip, wait for it to finish.
5. On the new theme, **Actions → Publish**.

That is the whole install. Two minutes.

> If Shopify says the file is not a valid theme, make sure you are uploading
> the `.zip` and not a folder you unzipped first.

---

## 3. Set up your menus

The header and footer read Shopify's normal menus, so they are edited in one
place and the whole store follows.

**Online Store → Navigation.**

- **Main menu** — what appears in the header. Add a link per collection.
- Create **Footer – Shop**, **Footer – Help** and **Footer – Company**, then
  point the three footer columns at them in the theme editor.

---

## 4. Add your products

All 52 of your products are already in `products-import.csv`, with names,
descriptions, benefit bullets, categories and photos.

### Before you import: set your prices

**22 of the 52 already have a verified price.** Each one was read off the
supplier's own pages and then checked against a second source before it went
in — see section 3 of the demo site's README for how, and why fifteen other
figures were thrown out.

**30 are still blank**, for two different reasons:

- **15 products the supplier no longer lists.** They import as **drafts**,
  tagged `unavailable-at-supplier`, so they cannot go on sale by accident.
  Leave them as drafts until you have confirmed they are really gone.
- **15 products that need a price from you.** Six had two candidate prices
  that I could not choose between, and nine appear on no page I could reach.
  You can read these off your phone in about two minutes.

One price needs your judgement rather than a copy: Walmart sells the scary
face headrest covers for **$1.99**. Free US shipping cannot come out of $1.99.

Open `products-import.csv` and fill in two columns:

| Column | What goes in it |
|---|---|
| `Variant Price` | what you are selling it for, e.g. `24.99` |
| `Variant Compare At Price` | the "was" price. This is what creates the crossed-out price and the discount badge. Leave it blank if you do not want one. |

Leave a price blank and Shopify imports that product at **$0.00**, which looks
like a working price. Fill them in first.

### Import it

**Products → Import → Add file**, choose `products-import.csv`, then **Upload
and continue**.

Shopify downloads each photo during the import and copies it onto its own CDN,
so the images become yours - they do not stay linked to anywhere else.

You can split the file and import in batches. Do ten, look at the store, then
do the rest.

### Every product has photos

All 52 arrive with the supplier's own photographs — 58 images in total. The
Walmart headrest covers were the last gap and now have four: fitted in a dark
car, the gag shot with the driver, a plain white-background shot, and the
dimension diagram.

### Two possible duplicates

These two pairs looked close enough that they may be the same item listed
twice. Both are in the file; delete a row if you agree they are duplicates.

- `halloween-tree-lights-black` and `halloween-tree-lights-24led`
- `skeleton-cardigan-black` and `skeleton-cardigan-colours`

### Adding more photos later

One row per extra photo: repeat the `Handle`, leave everything else blank, and
put the next photo in `Image Src` with `Image Position` 2, 3, 4 and so on.
Three photos per product is where the gallery looks best - most of yours
currently have one, because that is all the supplier listing carried.

### Products with sizes or colours

`products-template.csv` shows the pattern. Fill `Option1 Name` with `Size` and
add one row per size, repeating the `Handle` and changing `Option1 Value` and
`Variant Price`. The size buttons appear on the product page automatically.

Several of yours will need this - the cardigans, the sweaters, the overalls and
the slippers all come in sizes, and the phone cases come in models.

---

## 5. Collections

**Products → Collections → Create collection.** Set it to **Automated** and add
the condition *Product type is equal to ...*.

The import already sets the product type on every row, so make one collection
per type and they fill themselves:

| Collection | Condition | Products |
|---|---|---|
| LED Masks | Product type is equal to `LED Masks` | 6 |
| Lights & Candles | Product type is equal to `Lights & Candles` | 12 |
| Yard & Outdoor | Product type is equal to `Yard & Outdoor` | 8 |
| Home & Decor | Product type is equal to `Home & Decor` | 15 |
| Apparel | Product type is equal to `Apparel` | 7 |
| Accessories | Product type is equal to `Accessories` | 4 |

Anything you import later joins on its own, as long as you set the same type.
Then point the category tiles at them in the theme editor.

---

## 6. Optional: richer product pages

Skip this at launch. The pages are complete without it — this is what makes
them better, and you can do it one product at a time.

**Settings → Custom data → Products → Add definition.** Create these, all in
the `custom` namespace:

| Name | Namespace and key | Type |
|---|---|---|
| Hook | `custom.hook` | Single line text |
| Bullets | `custom.bullets` | Single line text, **List of values** |
| Features | `custom.features` | Single line text, **List of values** |
| Specs | `custom.specs` | Single line text, **List of values** |
| In the box | `custom.in_the_box` | Single line text, **List of values** |
| Badge | `custom.badge` | Single line text |

Then on any product, scroll to **Metafields**:

- **Hook** — one line under the title. *"The one piece that makes a driveway
  look like a film set."*
- **Bullets** — the checklist in the buy box. One short benefit per entry.
- **Features** — the three cards lower down. Write each as
  `Title | the sentence that explains it`, with a pipe between.
- **Specs** — the table, same `Label | Value` pattern.
- **In the box** — one item per entry.
- **Badge** — the corner label on the product card.

Leave any of them empty and that part of the page simply does not appear.

---

## 7. Payments

**Settings → Payments.** Turn on Shopify Payments, or connect PayPal or Stripe.
Until this is done the store cannot take money.

---

## 8. Connecting a supplier

For dropshipping, install one of DSers, AutoDS or Zendrop from the Shopify App
Store. They forward each order to your supplier so you are not placing them by
hand. Set this up before you start advertising.

---

## 9. Before you go live: the four hero masks

Four of the LED masks are Marvel character products - Spider-Man and
Spider-Gwen. I have named them descriptively in the import file rather than
using the character names.

Keep it that way. Selling the item is between you and your supplier, but
putting a trademarked character name in your own product title, description or
ads is what makes it your problem - it is one of the quicker routes to a
Shopify suspension or a frozen payout.

---

## 10. Go live

**Online Store → Preferences**, remove the password. Do these first:

- Check a real product page on your own phone
- Place a test order end to end
- Confirm the shipping rates under **Settings → Shipping**
- Add your refund, privacy and terms pages under **Settings → Policies** —
  Shopify can generate all three

---

## Where things are edited

| What | Where |
|---|---|
| Colours, logo, cart style | Online Store → Themes → Customize → Theme settings |
| Homepage layout and text | Customize, with the homepage selected |
| Product page layout | Customize, then switch the top dropdown to Products |
| Announcement bar | Customize → Announcement bar |
| Countdown date | Customize → Hero → Countdown |
| Menus | Online Store → Navigation |
| Product text and photos | Products |
