/* =========================================================
   Hollow & Hex - theme behaviour

   One file serves every template, so two rules run through all of it:
     1. every element lookup must tolerate absence. A product page has a
        gallery and no countdown; the homepage is the other way round.
     2. the cart is Shopify's, not ours. Nothing about a line item is stored
        or recalculated here - we POST the change and re-render from the
        response. A second copy of the cart in JavaScript is a second source
        of truth, and it drifts.
   ========================================================= */
(function () {
  'use strict';

  var T = window.THEME || {};
  var routes = T.routes || {};

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* Bind only if the element is actually on this page. */
  function on(el, ev, fn) { if (el) { el.addEventListener(ev, fn); } }

  /* ---------------------------------------------------------
     Money. Shopify hands us cents plus a format string; the
     variant switcher has to print prices without a round trip.
     --------------------------------------------------------- */
  function money(cents) {
    var fmt = T.moneyFormat || '${{amount}}';
    var value = '';

    function group(num, decimals, thousands, decimal) {
      if (isNaN(num) || num === null) { return '0'; }
      num = (num / 100.0).toFixed(decimals);
      var parts = num.split('.');
      var whole = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      var frac = parts[1] ? decimal + parts[1] : '';
      return whole + frac;
    }

    var match = fmt.match(/\{\{\s*(\w+)\s*\}\}/);
    var placeholder = match ? match[1] : 'amount';

    switch (placeholder) {
      case 'amount': value = group(cents, 2, ',', '.'); break;
      case 'amount_no_decimals': value = group(cents, 0, ',', '.'); break;
      case 'amount_with_comma_separator': value = group(cents, 2, '.', ','); break;
      case 'amount_no_decimals_with_comma_separator': value = group(cents, 0, '.', ','); break;
      case 'amount_with_apostrophe_separator': value = group(cents, 2, "'", '.'); break;
      default: value = group(cents, 2, ',', '.');
    }
    return fmt.replace(/\{\{\s*\w+\s*\}\}/, value);
  }

  /* ---------------------------------------------------------
     Toast
     --------------------------------------------------------- */
  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg) {
    if (!toastEl) { return; }
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 2600);
  }

  /* ---------------------------------------------------------
     Header + mobile menu
     --------------------------------------------------------- */
  var hdr = $('#hdr');
  function onScroll() {
    if (hdr) { hdr.classList.toggle('hdr--solid', window.scrollY > 20); }
    stickBar();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = $('#burger');
  var nav = $('#nav');
  on(burger, 'click', function () {
    var open = nav.classList.toggle('on');
    burger.classList.toggle('on', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('#nav a').forEach(function (a) {
    on(a, 'click', function () {
      if (nav) { nav.classList.remove('on'); }
      if (burger) { burger.classList.remove('on'); burger.setAttribute('aria-expanded', 'false'); }
    });
  });

  /* ---------------------------------------------------------
     Countdown. The target month and day come from theme settings
     and the year is worked out here, so it rolls over on its own
     instead of expiring the moment the date passes.
     --------------------------------------------------------- */
  var cdown = $('#cdown');
  if (cdown) {
    var m = parseInt(cdown.getAttribute('data-month'), 10) || 10;
    var d = parseInt(cdown.getAttribute('data-day'), 10) || 31;
    var cd = {
      d: $('#cd-d'), h: $('#cd-h'), mi: $('#cd-m'), s: $('#cd-s')
    };

    var tick = function () {
      var now = new Date();
      var target = new Date(now.getFullYear(), m - 1, d, 0, 0, 0);
      if (target - now < 0) { target = new Date(now.getFullYear() + 1, m - 1, d, 0, 0, 0); }

      var left = Math.max(0, target - now);
      var sec = Math.floor(left / 1000);
      var pad = function (n) { return n < 10 ? '0' + n : String(n); };

      if (cd.d) { cd.d.textContent = Math.floor(sec / 86400); }
      if (cd.h) { cd.h.textContent = pad(Math.floor(sec % 86400 / 3600)); }
      if (cd.mi) { cd.mi.textContent = pad(Math.floor(sec % 3600 / 60)); }
      if (cd.s) { cd.s.textContent = pad(sec % 60); }
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------
     Cart drawer
     --------------------------------------------------------- */
  var drawer = $('#cart');
  var scrim = $('#scrim');
  var cartBody = $('#cartbody');
  var cartSub = $('#cartsub');
  var cartN = $('#cartn');
  var checkoutBtn = $('#checkout');
  var lastFocus = null;

  function openCart() {
    if (!drawer) { return; }
    lastFocus = document.activeElement;
    if (scrim) { scrim.hidden = false; requestAnimationFrame(function () { scrim.classList.add('on'); }); }
    drawer.classList.add('on');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var x = $('#cartx');
    if (x) { x.focus(); }
  }

  function closeCart() {
    if (!drawer) { return; }
    drawer.classList.remove('on');
    drawer.setAttribute('aria-hidden', 'true');
    if (scrim) {
      scrim.classList.remove('on');
      setTimeout(function () { scrim.hidden = true; }, 300);
    }
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  on($('#cartbtn'), 'click', function () {
    if (document.body.getAttribute('data-cart-type') === 'page') {
      window.location.href = routes.cart_page;
      return;
    }
    openCart();
  });
  on($('#cartx'), 'click', closeCart);
  on(scrim, 'click', closeCart);
  on(document, 'keydown', function (e) {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('on')) { closeCart(); }
  });

  /* Re-render the drawer from the server rather than patching it here.
     The Liquid snippet stays the single description of a cart row. */
  function refreshCart(shouldOpen) {
    return fetch(routes.cart_page + '?section_id=cart-drawer-items', { credentials: 'same-origin' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var root = doc.getElementById('cart-render-root');
        if (!root) { return; }

        if (cartBody) { cartBody.innerHTML = root.innerHTML; }

        var count = parseInt(root.getAttribute('data-count'), 10) || 0;
        var subtotal = root.getAttribute('data-subtotal') || '';

        if (cartSub) { cartSub.textContent = subtotal; }
        if (cartN) {
          cartN.textContent = count;
          cartN.classList.toggle('on', count > 0);
        }
        if (checkoutBtn) { checkoutBtn.disabled = count === 0; }

        /* The cart PAGE shows the same lines as the drawer. Both are on screen
           at once there, so both have to be updated - refreshing only the
           drawer leaves the page the shopper is looking at frozen, and the
           quantity buttons read as broken. */
        var pgItems = $('#cartpg-items');
        var pgSub = $('#cartpg-sub');
        if (pgItems) { pgItems.innerHTML = root.innerHTML; }
        if (pgSub) { pgSub.textContent = subtotal; }
        if (pgItems && count === 0) { window.location.reload(); return; }

        if (shouldOpen) { openCart(); }
      })
      .catch(function () { /* leave the drawer as it was rather than blanking it */ });
  }

  function cartError(res) {
    return res.json().then(function (data) {
      throw new Error((data && data.description) || 'Could not update the cart');
    });
  }

  function addToCart(id, qty, btn) {
    if (!id) { return; }
    var original = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; }

    fetch(routes.cart_add, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: [{ id: id, quantity: qty || 1 }] })
    })
      .then(function (r) { return r.ok ? r.json() : cartError(r); })
      .then(function () {
        if (btn) {
          btn.classList.add('done');
          btn.textContent = 'Added';
          setTimeout(function () {
            btn.classList.remove('done');
            btn.textContent = original;
            btn.disabled = false;
          }, 1400);
        }
        return refreshCart(true);
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.textContent = original; }
        toast(err.message);
      });
  }

  function changeLine(key, qty) {
    fetch(routes.cart_change, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: key, quantity: qty })
    })
      .then(function (r) { return r.ok ? r.json() : cartError(r); })
      .then(function () { return refreshCart(false); })
      .catch(function (err) { toast(err.message); });
  }

  /* Delegated, because the drawer's contents are replaced wholesale on every
     change - handlers bound to the old rows would die with them. */
  /* Buy It Now: add this one item, then go to checkout.

     The variant id is read from the form's hidden #vid field at click time,
     NOT from the button's own data-vid. The button is rendered once with the
     first variant's id and the option pills rewrite #vid as the shopper
     chooses - keying off the stale attribute would have sent every buyer to
     checkout with the default size. */
  function buyNow(btn) {
    var vidEl = document.getElementById('vid');
    var qtyEl = document.getElementById('qtyi');
    var id = (vidEl && vidEl.value) || btn.getAttribute('data-vid');
    var qty = parseInt((qtyEl && qtyEl.value) || '1', 10) || 1;
    if (!id) { return; }
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'One moment...';

    fetch(routes.cart_add, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: [{ id: id, quantity: qty }] })
    })
      .then(function (r) { return r.ok ? r.json() : cartError(r); })
      .then(function () { window.location.href = routes.checkout; })
      .catch(function (err) {
        btn.disabled = false;
        btn.textContent = original;
        toast(err.message);
      });
  }

  on(document, 'click', function (e) {
    var now = e.target.closest ? e.target.closest('.js-buynow') : null;
    if (now) {
      e.preventDefault();
      buyNow(now);
      return;
    }

    var add = e.target.closest ? e.target.closest('.js-add') : null;
    if (add) {
      e.preventDefault();
      addToCart(add.getAttribute('data-vid'), 1, add);
      return;
    }

    var line = e.target.closest ? e.target.closest('[data-ck]') : null;
    if (line) {
      e.preventDefault();
      changeLine(line.getAttribute('data-ck'), parseInt(line.getAttribute('data-to'), 10));
    }
  });

  /* ---------------------------------------------------------
     Product page
     --------------------------------------------------------- */

  /* gallery */
  var stageImg = $('#stageimg');
  on($('#thumbs'), 'click', function (e) {
    var btn = e.target.closest ? e.target.closest('.pdp__thumb') : null;
    if (!btn || !stageImg) { return; }
    stageImg.src = btn.getAttribute('data-full');
    $$('.pdp__thumb').forEach(function (t) { t.classList.toggle('on', t === btn); });
  });

  /* quantity stepper, clamped so a fast clicker cannot reach 0 and add nothing */
  var qtyN = $('#qtyn');
  var qtyI = $('#qtyi');
  on($('#qty'), 'click', function (e) {
    var step = e.target.getAttribute && e.target.getAttribute('data-q');
    if (!step || !qtyN) { return; }
    var v = parseInt(qtyN.textContent, 10) + parseInt(step, 10);
    v = Math.min(20, Math.max(1, v));
    qtyN.textContent = String(v);
    if (qtyI) { qtyI.value = String(v); }
  });

  /* variants */
  var vdata = $('#variant-data');
  var variants = [];
  if (vdata) {
    try { variants = JSON.parse(vdata.textContent); } catch (err) { variants = []; }
  }

  var vidInput = $('#vid');
  var buyBtn = $('#buybtn');
  var priceEl = $('#pprice');
  var wasEl = $('#pwas');
  var stickPrice = $('#stickprice');
  var stickAdd = $('#stickadd');

  function selectedOptions() {
    return $$('#opts .opt').map(function (row) {
      var checked = $('input:checked', row);
      return checked ? checked.value : null;
    });
  }

  function currentVariant() {
    if (!variants.length) { return null; }
    if (!$('#opts')) { return variants[0]; }

    var chosen = selectedOptions();
    for (var i = 0; i < variants.length; i++) {
      var v = variants[i];
      var match = true;
      for (var j = 0; j < chosen.length; j++) {
        if (chosen[j] !== null && v.options[j] !== chosen[j]) { match = false; break; }
      }
      if (match) { return v; }
    }
    return null;
  }

  function applyVariant() {
    var v = currentVariant();

    /* An option combination that does not exist is not the same as one that is
       out of stock, and the button must not offer to add either. */
    if (!v) {
      if (buyBtn) { buyBtn.disabled = true; buyBtn.textContent = 'Unavailable'; }
      if (stickAdd) { stickAdd.disabled = true; }
      return;
    }

    if (vidInput) { vidInput.value = v.id; }
    if (priceEl) { priceEl.textContent = money(v.price); }
    if (stickPrice) { stickPrice.textContent = money(v.price); }

    /* Show the photo of the thing they just picked. Only some variants carry
       one - a size has no photo of its own, a colour usually does - so a
       variant with no image leaves the gallery exactly where it was rather
       than resetting it to the first frame. The matching thumbnail is
       highlighted too, otherwise the strip claims a different photo is showing
       than the one on screen. */
    var vsrc = v.featured_image && v.featured_image.src;
    if (vsrc && stageImg) {
      stageImg.src = vsrc;
      /* The thumb's data-full comes from image_url and carries a &width=900;
         the variant's src does not. Compare the file path only - matching the
         whole string finds nothing and quietly leaves the strip highlighting
         the wrong frame. */
      var key = function (u) { return String(u).split('?')[0].replace(/^https?:/, ''); };
      $$('.pdp__thumb').forEach(function (t) {
        t.classList.toggle('on', key(t.getAttribute('data-full')) === key(vsrc));
      });
    }

    if (wasEl) {
      if (v.compare_at_price && v.compare_at_price > v.price) {
        wasEl.textContent = money(v.compare_at_price);
        wasEl.style.display = '';
      } else {
        wasEl.style.display = 'none';
      }
    }

    /* The wording is read from data-add, not hardcoded. "Add to Cart" is a
       theme setting he can change to anything, and this line used to throw it
       away the moment a shopper touched a variant pill. */
    if (buyBtn) {
      buyBtn.disabled = !v.available;
      buyBtn.textContent = v.available
        ? (buyBtn.getAttribute('data-add') || 'Add to Cart') : 'Sold out';
    }
    if (stickAdd) {
      stickAdd.disabled = !v.available;
      stickAdd.textContent = v.available
        ? (stickAdd.getAttribute('data-add') || 'Add') : 'Sold out';
    }

    /* keep the URL honest so a copied link opens on the same variant */
    if (window.history && window.history.replaceState) {
      var url = new URL(window.location.href);
      url.searchParams.set('variant', v.id);
      window.history.replaceState({}, '', url.toString());
    }
  }

  on($('#opts'), 'change', function (e) {
    var row = e.target.closest ? e.target.closest('.opt') : null;
    if (row) {
      $$('.pill', row).forEach(function (p) {
        p.classList.toggle('on', p.contains(e.target));
      });
      var label = $('[data-sel]', row);
      if (label) { label.textContent = e.target.value; }
    }
    applyVariant();
  });

  /* the buy form is intercepted so the drawer can open instead of a page load */
  on($('#buyform'), 'submit', function (e) {
    e.preventDefault();
    var qty = qtyN ? parseInt(qtyN.textContent, 10) : 1;
    addToCart(vidInput ? vidInput.value : null, qty, buyBtn);
  });

  on(stickAdd, 'click', function () {
    var qty = qtyN ? parseInt(qtyN.textContent, 10) : 1;
    addToCart(vidInput ? vidInput.value : null, qty, stickAdd);
  });

  /* sticky bar: appears once the real buy button has scrolled past, and hides
     again when it comes back - two of them on screen at once is clutter */
  var stick = $('#stick');
  function stickBar() {
    if (!stick || !buyBtn) { return; }
    var past = buyBtn.getBoundingClientRect().bottom < 0;
    stick.classList.toggle('on', past);
    stick.setAttribute('aria-hidden', String(!past));
  }

  if (variants.length) { applyVariant(); }

  /* ---------------------------------------------------------
     Product recommendations. Shopify has not always computed
     them by first paint, so the section refetches itself.
     --------------------------------------------------------- */
  var recs = $('#recs');
  if (recs && recs.getAttribute('data-url')) {
    fetch(recs.getAttribute('data-url'))
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var fresh = doc.querySelector('#recs');
        if (fresh && fresh.innerHTML.trim()) {
          recs.innerHTML = fresh.innerHTML;
          reveal();
        }
      })
      .catch(function () { /* the section simply stays as rendered */ });
  }

  /* ---------------------------------------------------------
     Reveal on scroll. Anyone who asked their device for less
     movement gets the content immediately and no observer.
     --------------------------------------------------------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var io = null;

  function reveal() {
    var items = $$('.rv:not(.in)');
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });
    }
    items.forEach(function (el) { io.observe(el); });
  }
  reveal();

  /* ---------------------------------------------------------
     Category jump bar: highlight whichever section you are in.

     Driven by scroll position, not by which chip was clicked. Marking the
     clicked one is easy and wrong - it goes stale the second you scroll away,
     and it says nothing at all to someone who arrived by scrolling.
     --------------------------------------------------------- */
  /* An anchor link whose target is not on the page is worse than one fewer
     link, and on Shopify the two ends are configured separately: the jump bar
     is one section, each category row is another, and a row with no products
     removes itself. So a chip can be left pointing at nothing without anyone
     editing it - delete the last item in a category, or leave the fifteen
     supplier-unavailable products as drafts, and the chip survives its target.

     Checked here rather than in Liquid because a section cannot see whether a
     different section decided to render. */
  $$('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (!id || document.getElementById(id)) { return; }
    if (a.classList.contains('chip') || a.classList.contains('cat')) {
      a.hidden = true;
    }
  });

  var chipBar = $('#chips');
  if (chipBar) {
    var chips = $$('.chip', chipBar).filter(function (ch) {
      return (ch.getAttribute('href') || '').indexOf('#') === 0 && !ch.hidden;
    });
    var targets = chips.map(function (ch) {
      return document.getElementById(ch.getAttribute('href').slice(1));
    });
    var spy = function () {
      /* the first pixel of content visible under the header and the chip bar */
      var line = chipBar.getBoundingClientRect().bottom + 8;
      var best = -1;
      targets.forEach(function (sec, i) {
        if (!sec) { return; }
        var r = sec.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) { best = i; }
      });
      chips.forEach(function (ch, i) { ch.classList.toggle('on', i === best); });
    };
    spy();
    window.addEventListener('scroll', spy, { passive: true });
    window.addEventListener('resize', spy);
  }
})();
