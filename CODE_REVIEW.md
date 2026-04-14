# Crypto Lifeguard — Full Stack Code Review
**Date:** April 2026  
**Scope:** All HTML pages, brand.css, and inline JavaScript  
**Severity scale:** 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low / Improvement

---

## Executive Summary

The site is well-structured and visually polished. The core HTML is clean, the CSS design system is coherent, and the JavaScript is minimal and correct. The most significant issues fall into three clusters: **no mobile navigation at all** (users on phones cannot navigate between pages), **the beta form does nothing on submit**, and **Tailwind CDN in production** (a ~350 KB JS runtime that rewrites styles in-browser — fine for prototyping, must be replaced before launch). Everything else is improvements rather than blockers.

---

## 1. Critical Issues

### 🔴 C1 — No mobile navigation
**File:** all pages  
**Problem:** All nav links are wrapped in `<ul class="hidden md:flex ...">`. There is no hamburger menu, drawer, or alternative navigation for viewports below 768 px. Mobile users cannot reach Roadmap, Contact, Pricing, Sentinel AI, or any other page from the header.  
**Fix:** Add a hamburger button that toggles a mobile drawer, or at a minimum make the logo a home link and add the core links to the footer (the footer already has some, but not all — Sentinel AI and FAQ are missing).

---

### 🔴 C2 — Beta form submit button does nothing
**File:** index.html, line 746  
**Problem:** `<button type="button" class="btn-primary ...">Request invite</button>` — the `type="button"` attribute explicitly prevents form submission. There is no `onclick` handler, no `form.addEventListener('submit')`, and no `action` on the `<form>`. Clicking the button is a no-op.  
**Fix:** Either connect a real backend endpoint (`<form action="…" method="POST">` and `<button type="submit">`) or wire up a JavaScript handler (e.g., a Mailchimp embedded form, Formspree, or a fetch call to your API).

---

### 🔴 C3 — Tailwind CDN in production
**File:** all pages, `<head>`  
**Problem:** `<script src="https://cdn.tailwindcss.com">` loads the full Tailwind JIT runtime (~350 KB of JavaScript) which parses every HTML element and generates CSS in the browser. This blocks rendering, is slow on low-end devices, cannot be cached as a stylesheet, and is explicitly warned against in Tailwind's own docs for production use.  
**Fix:** Run `npx tailwindcss -i ./input.css -o ./brand-tw.css --minify` as a build step and reference the compiled stylesheet instead. The combined output with brand.css will likely be under 30 KB.

---

## 2. High-Priority Issues

### 🟠 H1 — Invalid CSS property in `.tl-dot`
**File:** brand.css, line 451  
**Problem:** `ring:4px solid #fff;` is not valid CSS — `ring` is a Tailwind utility class name, not a CSS property. The browser silently ignores it. The rule that was intended (`box-shadow: 0 0 0 4px #fff`) is listed directly below it, so the visual result happens to be correct, but this is dead/erroneous code.  
**Fix:** Remove the `ring:4px solid #fff;` line.

```css
/* Remove this line from .tl-dot: */
ring:4px solid #fff;
```

---

### 🟠 H2 — SVG symbol defs duplicated across every page
**File:** index.html, roadmap.html, contact.html, privacy.html, terms.html  
**Problem:** The hidden `<svg><defs>…</defs></svg>` block (containing `logo-mark`, `i-check`, `i-arrow`, etc.) is copy-pasted into every page. This adds ~1–2 KB of redundant HTML to every page load and creates a maintenance hazard — changing an icon requires editing every file.  
**Fix:** Either inline a single shared sprite file via a server-side include / build step, or load it once via a small fetch:
```js
fetch('/icons.svg').then(r=>r.text()).then(html=>{
  document.body.insertAdjacentHTML('afterbegin', html);
});
```

---

### 🟠 H3 — Inconsistent Google Fonts weights across pages
**File:** contact.html, privacy.html, terms.html  
**Problem:** These pages load `Inter:wght@400;500;700` but the CSS uses weight `600` (`.eyebrow`, `.nav-link`, `.marquee-item`) and weight `800` (some headings). When a requested weight is missing, browsers synthesise it — resulting in subtly wrong type rendering compared to index.html which correctly loads `400;500;600;700;800`.  
**Fix:** Use the same font URL across all pages:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

---

### 🟠 H4 — Dead CSS: `.on-light` nav state and `.tl-dot`
**File:** brand.css, lines 74–78 and 445–457  
**Problem:**  
- `.nav-root.scrolled.on-light` — the JavaScript scroll handler only ever toggles `.scrolled`. The `.on-light` class is never added anywhere, so this entire ruleset is dead.  
- `.tl-dot` / `.tl-dot.live` — the roadmap timeline was rewritten to use a flexbox layout. The absolute-positioning `.tl-dot` class is no longer used in any HTML.  
**Fix:** Delete both dead rulesets.

---

### 🟠 H5 — No `<main>` landmark element on any page
**File:** all pages  
**Problem:** None of the pages wrap page content in `<main>`. Screen readers rely on landmark elements (`<main>`, `<nav>`, `<header>`, `<footer>`) for navigation. Without `<main>`, keyboard users have no shortcut to skip past the header to content.  
**Fix:** Wrap the page body content in `<main>`:
```html
<main id="content">
  <!-- all sections go here -->
</main>
```
Also add a skip link before the header:
```html
<a href="#content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-clg-blue text-white px-4 py-2 rounded-lg z-[100]">Skip to content</a>
```

---

### 🟠 H6 — No focus-visible styles on interactive elements
**File:** brand.css  
**Problem:** Buttons (`.btn-primary`, `.btn-secondary`, `.btn-ghost`) and nav links have no `:focus-visible` styling. The browser default outline is suppressed by many resets. Keyboard users cannot see which element is focused.  
**Fix:**
```css
.btn-primary:focus-visible,
.btn-secondary:focus-visible,
.btn-ghost:focus-visible {
  outline: 2px solid #3BB4AD;
  outline-offset: 3px;
}
a:focus-visible { outline: 2px solid #3BB4AD; outline-offset: 2px; }
```

---

## 3. Medium-Priority Issues

### 🟡 M1 — Missing Open Graph and Twitter Card meta tags
**File:** all pages, `<head>`  
**Problem:** When the site is shared on social media (Twitter/X, LinkedIn, WhatsApp), there are no OG tags so platforms fall back to guessing title and description. No image will be shown.  
**Fix:** Add to each page's `<head>`:
```html
<meta property="og:type" content="website"/>
<meta property="og:title" content="Crypto Lifeguard | Protect your tokens before it's too late"/>
<meta property="og:description" content="Personalised, verified alerts that keep you safe from missed migrations, forks, protocol changes and scams."/>
<meta property="og:image" content="https://cryptolifeguard.app/og-image.png"/>
<meta property="og:url" content="https://cryptolifeguard.app/"/>
<meta name="twitter:card" content="summary_large_image"/>
```

---

### 🟡 M2 — No canonical URL
**File:** all pages  
**Problem:** Without `<link rel="canonical">`, search engines may index multiple URL variants (with/without trailing slash, www vs non-www) as duplicate pages.  
**Fix:**
```html
<link rel="canonical" href="https://cryptolifeguard.app/"/>
```
(Adjust the URL per page.)

---

### 🟡 M3 — Form inputs missing proper `id`/`for` associations and `autocomplete`
**File:** index.html, lines 734–748  
**Problem:** The email `<input>` and `<select>` are wrapped in `<label>` elements which is acceptable, but they lack `id` attributes. More critically, the email input has no `autocomplete="email"` attribute, which prevents browsers and password managers from auto-completing correctly.  
**Fix:**
```html
<input type="email" id="beta-email" autocomplete="email" placeholder="you@example.com" …/>
<label for="beta-email">Email</label>

<select id="beta-use" autocomplete="off" …>…</select>
<label for="beta-use">How will you use Crypto Lifeguard?</label>
```

---

### 🟡 M4 — `<a href="#">` placeholder link
**File:** index.html, line 422  
**Problem:** `<a href="…" class="text-clg-blue font-bold">View action steps →</a>` links to `#` inside the verification card. This scrolls the page to the top and looks broken to users.  
**Fix:** Either remove the link until the destination exists, or add `href="javascript:void(0)"` with an appropriate `aria-disabled="true"` and a `title` explaining it's coming soon.

---

### 🟡 M5 — `transition: all` in `.btn-secondary` and `.btn-ghost`
**File:** brand.css, lines 247 and 256  
**Problem:** `transition:all` animates every CSS property simultaneously. This can trigger expensive layout recalculations when properties like `width` or `height` are accidentally animated, and is a general performance anti-pattern.  
**Fix:**
```css
.btn-secondary{
  transition: background .25s var(--ease-out-quint),
              color .25s var(--ease-out-quint),
              border-color .25s var(--ease-out-quint),
              transform .25s var(--ease-out-quint);
}
```

---

### 🟡 M6 — No Subresource Integrity on external scripts
**File:** all pages  
**Problem:** `<script src="https://cdn.tailwindcss.com">` and the Google Fonts `<link>` have no `integrity` attribute. If the CDN were compromised, there is no defence against injected code.  
**Fix:** Once Tailwind CDN is replaced with a compiled stylesheet (see C3), this becomes moot for the script. For the fonts link, SRI is not practical because Google Fonts changes URLs, but self-hosting the font files removes the risk entirely.

---

### 🟡 M7 — Colour contrast: grey body text on white may fail WCAG AA
**File:** brand.css and HTML  
**Problem:** `#6D7A8A` (clg-grey50) on `#FFFFFF` has a contrast ratio of approximately 4.05:1 — this passes WCAG AA for large/bold text (≥18.67 px or ≥14 px bold) but fails for small body text (requires 4.5:1). Feature card descriptions, pricing copy, and FAQ answers use this combination at 14–16 px.  
**Fix:** Darken `--clg-grey50` to `#5A6775` (ratio ~5.0:1) which still reads as secondary grey while meeting WCAG AA across all text sizes.

---

### 🟡 M8 — `document.documentElement.scrollTop` vs `window.scrollY`
**File:** index.html, roadmap.html, contact.html, line ~836  
**Problem:** `document.documentElement.scrollTop` is historically unreliable in older Safari (where the scroll position was reported on `document.body.scrollTop`). `window.scrollY` is the modern cross-browser standard and always correct.  
**Fix:**
```js
// Replace in onScroll():
const scrolled = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
if (window.scrollY > 24) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
```

---

### 🟡 M9 — Scroll progress bar not `aria-hidden`
**File:** all pages  
**Problem:** `<div class="scroll-progress" id="progressBar"></div>` is a visual decoration with no semantic meaning, but it is not marked `aria-hidden="true"`. Screen readers may announce it as an unnamed element.  
**Fix:** `<div class="scroll-progress" id="progressBar" aria-hidden="true" role="presentation"></div>`

---

## 4. Low Priority / Improvements

### 🟢 L1 — No sitemap.xml or robots.txt
The site has a `CNAME` file (confirming it's on GitHub Pages / custom domain) but there is no `sitemap.xml` or `robots.txt`. Both help search engine crawling.

---

### 🟢 L2 — SVG defs element could be better hidden
**File:** all pages  
**Problem:** `<svg width="0" height="0" style="position:absolute">` is functional but can briefly affect layout or create a small invisible clickable region. A more robust pattern:
```html
<svg aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden;">
```

---

### 🟢 L3 — `backdrop-filter` missing `-webkit-` prefix on `.phone-alert` and `.tag`
**File:** brand.css  
**Problem:** `.phone-alert` uses `backdrop-filter:blur(10px)` and `.tag` uses `backdrop-filter:blur(6px)` without the `-webkit-backdrop-filter` prefix. These render correctly in Chrome/Firefox but may not blur in some older WebKit builds.  
**Fix:** Add `-webkit-backdrop-filter` alongside `backdrop-filter` for both classes.

---

### 🟢 L4 — `img, svg, video { height:auto }` overrides Tailwind `h-4`, `h-8` etc.
**File:** brand.css, line 32  
**Problem:** The global reset `img, svg, video { max-width:100%; height:auto; }` applies `height:auto` to ALL svg elements. Tailwind's `h-4`, `h-8` classes set `height: 1rem` etc., but because brand.css loads after the Tailwind config script generates styles, specificity differences could mean the reset wins in some cases. The inline SVG icons seem to be rendering correctly, but this is a fragile interaction.  
**Fix:** Scope the rule to only `<img>` and `<video>`, and handle SVG separately:
```css
img, video { max-width:100%; height:auto; }
svg { max-width:100%; overflow:visible; }
```

---

### 🟢 L5 — Footer missing Sentinel AI link
**File:** index.html, footer section  
**Problem:** The footer "Product" list links to Features, Pricing, and Roadmap, but not to Sentinel AI. Given its prominence in the nav and as a key selling point, it should be included.

---

### 🟢 L6 — Redundant `position:relative` on `body`
**File:** brand.css, line 28  
**Problem:** `body { position:relative; }` was added as a Safari overflow fix but is unnecessary given that `html { overflow-x:hidden }` and `body { overflow-x:hidden }` are already set. The `position:relative` on body can create stacking context issues with `position:fixed` children in some edge cases.  
**Fix:** Remove `position:relative` from `body`. The overflow containment is sufficient.

---

### 🟢 L7 — Pricing does not mention Sentinel AI
**File:** index.html, pricing section  
**Problem:** The Free, Premium, and Pro tiers make no mention of Sentinel AI access. If Sentinel AI is a paid feature, this should be clearly called out in the pricing table. If it's free for all, say so — it's a compelling differentiator.

---

### 🟢 L8 — No `lang` attribute on `<html>` in privacy.html
**File:** privacy.html  
Actually — all pages do have `lang="en"` on `<html>`. ✓ No action needed.

---

### 🟢 L9 — No structured data
Consider adding JSON-LD `Organization` or `WebSite` schema to the homepage for rich search results:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Crypto Lifeguard",
  "url": "https://cryptolifeguard.app",
  "description": "Personalised, verified alerts for crypto users"
}
</script>
```

---

## 5. Summary Table

| ID | Severity | Area | Issue |
|----|----------|------|-------|
| C1 | 🔴 Critical | UX | No mobile navigation exists |
| C2 | 🔴 Critical | Functionality | Beta form submit button is broken |
| C3 | 🔴 Critical | Performance | Tailwind CDN in production (~350 KB runtime) |
| H1 | 🟠 High | CSS | Invalid `ring:` property in `.tl-dot` |
| H2 | 🟠 High | Maintainability | SVG symbol defs duplicated across all 5 pages |
| H3 | 🟠 High | Visual | Inconsistent Google Fonts weights across pages |
| H4 | 🟠 High | CSS | Dead code: `.on-light` and `.tl-dot` rulesets |
| H5 | 🟠 High | Accessibility | No `<main>` landmark or skip link on any page |
| H6 | 🟠 High | Accessibility | No `:focus-visible` styles on buttons or links |
| M1 | 🟡 Medium | SEO | No Open Graph / Twitter Card meta tags |
| M2 | 🟡 Medium | SEO | No canonical URL |
| M3 | 🟡 Medium | Accessibility | Form inputs missing `id`/`for` and `autocomplete` |
| M4 | 🟡 Medium | UX | `href="#"` placeholder link in verification card |
| M5 | 🟡 Medium | Performance | `transition:all` in `.btn-secondary`, `.btn-ghost` |
| M6 | 🟡 Medium | Security | No SRI on external CDN scripts |
| M7 | 🟡 Medium | Accessibility | `#6D7A8A` contrast ratio ~4.05:1 — fails AA for small text |
| M8 | 🟡 Medium | JS | `scrollTop` vs `window.scrollY` (Safari compatibility) |
| M9 | 🟡 Medium | Accessibility | Scroll progress bar not `aria-hidden` |
| L1 | 🟢 Low | SEO | No sitemap.xml or robots.txt |
| L2 | 🟢 Low | HTML | SVG defs element could be better hidden |
| L3 | 🟢 Low | CSS | Missing `-webkit-backdrop-filter` on `.phone-alert` and `.tag` |
| L4 | 🟢 Low | CSS | Global `height:auto` on `svg` may conflict with Tailwind height utilities |
| L5 | 🟢 Low | UX | Footer missing Sentinel AI link |
| L6 | 🟢 Low | CSS | Redundant `position:relative` on body |
| L7 | 🟢 Low | UX | Pricing tiers don't mention Sentinel AI access |
| L9 | 🟢 Low | SEO | No JSON-LD structured data |

---

## 6. Recommended Fix Order

**Before launch (must-fix):**
1. C2 — Wire up the beta form to a real endpoint
2. C1 — Add a mobile nav / hamburger menu
3. C3 — Replace Tailwind CDN with compiled CSS
4. H1 — Remove invalid `ring:` CSS line
5. H5 — Add `<main>` and a skip link
6. H6 — Add `:focus-visible` styles

**Shortly after launch:**
7. H3 — Standardise font weights across all pages
8. H4 — Remove dead CSS
9. H2 — Centralise SVG sprite
10. M1 + M2 — Add OG tags and canonical links
11. M3 — Fix form field associations and autocomplete
12. M8 — Switch to `window.scrollY`

**Backlog:**
- M7 — Darken secondary text colour for WCAG AA
- L3 — Add `-webkit-backdrop-filter` prefix
- L4 — Scope global svg height reset
- L5 — Add Sentinel AI to footer
- L7 — Call out Sentinel AI access in pricing table
- L1 + L9 — Sitemap and structured data
