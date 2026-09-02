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

### The quick way — import a spreadsheet

1. Open `products-import.csv`.
2. Fill in a row per product. The columns that matter:

   | Column | What goes in it |
   |---|---|
   | `Handle` | short name, lowercase with hyphens — becomes the page address |
   | `Title` | the product name shoppers see |
   | `Body (HTML)` | the description. Plain sentences are fine |
   | `Type` | Decor, Costumes, Lighting, Party — used for the category tiles |
   | `Tags` | `badge:Best seller` puts that label on the product card |
   | `Variant Price` | your selling price, e.g. `24.99` |
   | `Variant Compare At Price` | the "was" price — this is what creates the crossed-out price and the discount badge |
   | `Image Src` | a full web address to the photo |

3. In Shopify: **Products → Import → Add file**, choose your CSV, **Upload and
   continue**.

You can import in batches. Do ten, look at the store, then do the rest.

### Adding more photos

One row per extra photo: repeat the `Handle`, leave everything else blank, and
put the next photo in `Image Src` with `Image Position` 2, 3, 4 and so on.
Three photos per product is where the gallery looks best.

### Products with sizes or colours

Fill `Option1 Name` with `Size` and add one row per size, repeating the
`Handle` and changing `Option1 Value` and `Variant Price`. The size buttons
appear on the product page automatically.

---

## 5. Collections

**Products → Collections → Create collection.** Set it to **Automated** and add
a condition like *Product type is equal to Decor*. Every matching product joins
on its own, including ones you import later.

Make one per category, then point the four category tiles at them in the theme
editor.

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

## 9. Go live

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
