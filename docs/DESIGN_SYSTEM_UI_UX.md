# RIO COLLECTION — DESIGN SYSTEM & UI/UX SPECIFICATION

> **Document Status:** Production-Ready Handoff Specification  
> **Source Inputs:** PRD (`tshirt_catalogue_order_management_prd.md`), Master Prompt Standards, and Stitch Design Specifications (`stitch_premium_minimalist_t_shirt_catalogue`).  
> **Target Project:** `rio-collection-catalogue`  
> **Architectural Guardrail:** All public catalogue designs defined in this specification MUST be strictly scoped to public pages. Existing dashboard components (`components/dashboard`, `components/ui`, etc.) and their styling must remain 100% untouched.

---

# 1. Product Understanding & Requirement Audit

## 1.1 Product Overview
- **Product:** RIO COLLECTION — Limited T-Shirt Catalogue & Brand Journal.
- **Primary Customer:** Quality-conscious buyers, slow fashion enthusiasts, and brand collectors seeking limited-edition T-shirts.
- **Business Owner:** Independent T-shirt brand creator managing low-volume, limited-drop releases with manual payment processing.
- **Primary Customer Goal:** Discover brand releases, view archival history, select variants, and easily submit purchase requests without account registration.
- **Primary Business Goal:** Showcase products professionally, preserve brand history, collect structured purchase requests, mitigate spam, and retain final control over payment verification and stock deduction.
- **Core Transaction:** Purchase Request Submission $\rightarrow$ Manual WhatsApp Contact & Payment $\rightarrow$ Owner Confirmation $\rightarrow$ Stock Deduction.

> **Core Principle:** Order Request $\neq$ Completed Sale. Submitting an order creates a pending purchase request. The product becomes **SOLD** and inventory is deducted **only after the owner manually confirms payment**.

## 1.2 Requirement Audit Table

| Feature / Area | PRD Status | Design & UX Impact |
|---|---|---|
| **Product Catalogue** | CONFIRMED | Public catalogue listing available & past drops |
| **Guest Checkout** | CONFIRMED | No customer login, pure guest order form |
| **Manual Payment** | CONFIRMED | Payment via bank transfer; confirmation via WhatsApp |
| **Stock Deduction** | CONFIRMED | Deducted strictly on `PAID` status (not on `PENDING`) |
| **Anti-Spam** | CONFIRMED | Turnstile CAPTCHA, Honeypot, Rate Limiting, Duplicate Check |
| **Brand Journal** | CONFIRMED | Editorial section for story, announcements & drops |
| **Past Drops / Archive** | CONFIRMED | Out-of-stock items remain permanently visible as archive |
| **Stock Granularity** | TBD | Flexible variant selector (Size / Size + Color) |
| **Dashboard Protection** | CONFIRMED | **DO NOT modify existing admin/dashboard UI components** |

---

# 2. Design System Architecture & Tokens

The design system for RIO COLLECTION is named **Independent Editorial**. It combines minimalist luxury, brutalist precision, and print art-book aesthetics. Negative space is treated as a primary design element, and elements utilize strict 90-degree (0px) geometry.

## 2.1 Color Tokens

The palette relies on a restrained neutral ecosystem with off-white canvas tones, grounded charcoal typography, stone structural dividers, and a rare cobalt accent.

```yaml
colors:
  # Canvas & Surface System
  surface: '#fcf9f8'                # Global warm off-white canvas
  surface-dim: '#ddd9d8'            # Dimmed background state
  surface-bright: '#fdf8f8'         # Bright contrast surface
  surface-container-lowest: '#ffffff' # Card lowest container
  surface-container-low: '#f7f3f2'    # Subtle component background
  surface-container: '#f0edec'        # Secondary surface container
  surface-container-high: '#ebe7e6'   # High contrast surface container
  surface-container-highest: '#e5e2e1'# Highest contrast surface container
  
  # Typography & On-Surface Controls
  on-surface: '#1c1b1b'             # Main text & high contrast typography
  on-surface-variant: '#444748'     # Muted body copy & secondary labels
  inverse-surface: '#313030'        # Dark surface container
  inverse-on-surface: '#f4f0ef'      # Text on dark surface
  
  # Primary Brand Anchors
  primary: '#000000'                # Deep black UI anchors
  on-primary: '#ffffff'             # Text on primary CTA
  primary-container: '#1c1b1b'      # Dark primary container
  on-primary-container: '#858383'   # Muted text on primary container
  charcoal: '#1A1A1A'               # Heavy UI text & primary CTA fill
  
  # Structural Neutrals
  secondary: '#5f5e5b'              # Secondary accent & labels
  on-secondary: '#ffffff'           # Text on secondary
  secondary-container: '#e4e2dd'    # Soft grey surface
  on-secondary-container: '#656461' # Medium neutral label
  stone: '#E2E0DB'                  # Structural hairline borders & dividers
  outline: '#747878'                # Outline borders
  outline-variant: '#c4c7c7'        # Muted outlines
  
  # Utility & Accents
  accent-cobalt: '#001e81'          # Digital ink accent (scarcity indicator)
  error: '#ba1a1a'                  # Error state red
  on-error: '#ffffff'               # Text on error
  error-container: '#ffdad6'        # Light red warning container
  on-error-container: '#93000a'    # Dark red error text
```

## 2.2 Typography Tokens

Typography pairing relies on **EB Garamond** for editorial headers and display statements, paired with **Hanken Grotesk** for clean functional UI controls, product specs, and labels.

```yaml
typography:
  # Editorial & Display (EB Garamond)
  display-lg:
    font-family: "'EB Garamond', serif"
    font-size: 72px
    font-weight: 400
    line-height: 80px
    letter-spacing: -0.02em
  headline-lg:
    font-family: "'EB Garamond', serif"
    font-size: 48px
    font-weight: 400
    line-height: 56px
    letter-spacing: -0.01em
  headline-lg-mobile:
    font-family: "'EB Garamond', serif"
    font-size: 32px
    font-weight: 400
    line-height: 40px
    letter-spacing: -0.01em
  headline-md:
    font-family: "'EB Garamond', serif"
    font-size: 32px
    font-weight: 400
    line-height: 40px

  # Workhorse UI & Copy (Hanken Grotesk)
  body-lg:
    font-family: "'Hanken Grotesk', sans-serif"
    font-size: 18px
    font-weight: 400
    line-height: 28px
  body-md:
    font-family: "'Hanken Grotesk', sans-serif"
    font-size: 16px
    font-weight: 400
    line-height: 24px
  label-caps:
    font-family: "'Hanken Grotesk', sans-serif"
    font-size: 12px
    font-weight: 600
    line-height: 16px
    letter-spacing: 0.08em
    text-transform: uppercase
  price-display:
    font-family: "'Hanken Grotesk', sans-serif"
    font-size: 20px
    font-weight: 500
    line-height: 24px
```

## 2.3 Layout, Spacing & Elevation

- **Baseline Grid:** 4px baseline rhythm.
- **Desktop Grid:** 12 columns, 64px fixed outer margins, 24px gutters. Asymmetric column offsets (e.g. 6-column right placement with left open for editorial vertical text).
- **Mobile Grid:** 4 columns, 16px outer margins. Headline text resizes aggressively to avoid awkward hyphenations.
- **Section Spacing:**
  - Large gap (`section-gap-lg`): 96px
  - Medium gap (`section-gap-md`): 64px
- **Elevation & Depth:**
  - **No Drop Shadows:** Drop shadows are strictly prohibited. Depth is achieved via **Tonal Layering** (`surface-container` background over `surface` canvas).
  - **Hairline Borders:** 1px solid borders in `stone` (`#E2E0DB`) or 10% opacity `charcoal`.
- **Shape Language:**
  - **Strict 0px Sharp Corners:** All images, cards, buttons, modal dialogs, and text input boxes feature exact 90-degree sharp corners (`rounded-none`).

---

# 3. Component System Specification

## 3.1 Public Navigation (`Navbar`)
- **Desktop:** Minimal top-level bar anchored on `surface`. Centered or left-aligned `RIO COLLECTION` logotype in `headline-md` EB Garamond. Sparse links: `CATALOGUE`, `ARCHIVE`, `JOURNAL`, `ORDER LOOKUP`.
- **Mobile Navigation:** Minimal header bar with brand title and menu trigger. Mobile drawer is a **full-screen takeover overlay** with `display-lg` serif links and solid `surface` background (0% blur).

## 3.2 Buttons
- **Primary CTA Button:**
  - Style: Solid Charcoal (`#1c1b1b`) fill, White text (`#ffffff`), `label-caps` typography, exact `0px` radius.
  - Interaction: 150ms opacity transition on hover (hover: opacity 0.85). No motion or lift animation.
- **Secondary / Outline Button:**
  - Style: Transparent fill, 1px Charcoal outline, Charcoal text, `0px` radius.
  - Interaction: Hover fills background with `surface-container` (`#f0edec`).

## 3.3 Form Inputs (`OrderForm` Inputs)
- **Style:** Bottom-border line only (1px `stone` or outline), transparent background, floating `label-caps` descriptor.
- **States:** Active/Focus turns bottom line to 1px Charcoal (`#1c1b1b`). Error turns bottom line to `error` (`#ba1a1a`).

## 3.4 Product Cards (`ProductCard`)
- **Card Container:** Borderless, 0px radius.
- **Aspect Ratio:** 4:5 vertical photographic ratio.
- **Metadata Layout:** Left-aligned under image. Product title in `Hanken Grotesk` or `EB Garamond`, price in `price-display`, and release tag/status badge (`AVAILABLE` / `OUT OF STOCK`).

## 3.5 Status Badges (`StatusBadge`)
- **AVAILABLE:** Minimalist tag, 1px Charcoal outline or solid Charcoal fill with crisp uppercase label.
- **OUT OF STOCK:** Stone background (`#e4e2dd`), muted grey text (`#656461`).

---

# 4. Information Architecture & Sitemap

```text
RIO COLLECTION PUBLIC APP
├── / (Home)
│   ├── Hero Drop Announcement
│   ├── Featured Products Grid
│   ├── Brand Manifesto & Archival Teaser
│   └── Latest Journal Snippets
├── /catalogue (Current Collection)
│   ├── Active Product Grid
│   ├── Size & Variant Quick View
│   └── Direct Link to Order Form
├── /archive (Past Drops & Out-of-Stock)
│   ├── Archival Product Gallery
│   └── Historical Detail View
├── /products/[slug] (Product Detail Page)
│   ├── Gallery (Multi-angle view)
│   ├── Product Description & Garment Specs
│   ├── Variant Selector (Size / Color)
│   └── Order CTA ("Submit Purchase Request")
├── /order (Guest Checkout / Order Info)
│   ├── Selected Item Summary
│   ├── Guest Contact Form (Name, Phone/WhatsApp, Address)
│   ├── Anti-Spam (Turnstile + Honeypot)
│   └── Submission Disclaimer
├── /order/confirmation/[orderNumber] (Order Confirmation)
│   ├── Unique Order Number Banner (e.g. TSH-2026-000123)
│   ├── Order Details & Status (`PENDING`)
│   ├── Owner WhatsApp Contact Shortcut Button
│   └── Manual Payment Instructions
└── /journal (Brand Journal / Blog)
    ├── Article Grid & Featured Post
    └── /journal/[slug] (Article Detail Page)

ISOLATED ADMIN DASHBOARD (UNTOUCHED BY STITCH SYSTEM)
└── /admin/... (Existing Dashboard Components & Layouts)
```

---

# 5. Screen-by-Screen UI/UX Specifications

## Screen 1: Home Page (`/`)
- **Hero Section:** Full-width archival visual, serif display title `RIO COLLECTION — EDISI 001`, subtitle in `label-caps`, primary CTA `EXPLORE COLLECTION`.
- **Featured Products Section:** Asymmetric 12-column grid showing current drop items. Asymmetric left column contains editorial brand statement in Garamond text.
- **Past Drops Banner:** Minimal split-screen section highlighting out-of-stock archival items with `ARCHIVED` status.
- **Journal Preview:** Horizontal 2-column or 3-column article cards with headline, date, and reading link.

## Screen 2: Product Catalogue (`/catalogue`) & Drop Archive (`/archive`)
- **Header:** Title `CATALOGUE` or `DROP ARCHIVE` in `headline-lg`, collection filters (`ALL`, `CURRENT DROP`, `ARCHIVE`).
- **Grid Layout:** 3-column desktop / 2-column tablet / 1-column mobile grid of `ProductCard` components.
- **Out of Stock Display:** Historical items display `OUT OF STOCK` tag; ordering button disabled or replaced with `VIEW ARCHIVE STORY`.

## Screen 3: Product Detail Page (`/products/[slug]`)
- **Layout:** Split layout. Left column (6 cols desktop): Vertical gallery of hi-res images (0px corners). Right column (6 cols desktop): Sticky product info panel.
- **Product Info Panel:**
  - Title in Garamond `headline-lg`.
  - Price in `price-display` (e.g. `IDR 350.000`).
  - Garment specifications & measurements table in `Hanken Grotesk`.
  - Variant Selector: Grid of size buttons (`S`, `M`, `L`, `XL`) with 1px stone border; selected state filled with Charcoal.
  - Quantity Selector: Minimal `-` and `+` numerical input.
  - CTA Button: `SUBMIT PURCHASE REQUEST` (Primary Charcoal button). If out of stock, button displays `OUT OF STOCK` in disabled stone styling.

## Screen 4: Guest Order Form / Checkout Page (`/order`)
- **Header:** `PURCHASE REQUEST` with explanatory note: *"Submitting this form reserves your order request. Payment will be confirmed via WhatsApp before stock deduction."*
- **Form Sections:**
  - **Item Summary Card:** Product thumbnail, title, selected size/variant, quantity, and total amount.
  - **Customer Details Form:**
    - Full Name (Required)
    - WhatsApp / Phone Number (Required, with format validation)
    - Shipping Address (Required)
    - Email Address (Optional)
    - Order Notes (Optional)
  - **Anti-Spam Controls:**
    - Hidden Honeypot Input (invisible to real users)
    - Cloudflare Turnstile CAPTCHA container
  - **Submit Button:** `CONFIRM ORDER REQUEST` with loading state feedback.

## Screen 5: Order Confirmation Page (`/order/confirmation/[orderNumber]`)
- **Header:** `PURCHASE REQUEST RECEIVED` badge.
- **Order Number Display:** Large mono/caps order code (e.g. `TSH-2026-000123`).
- **Next Steps Guide:**
  1. *Request Pending:* Order request logged into the system.
  2. *WhatsApp Confirmation:* Owner will contact customer or customer can click `CONTACT VIA WHATSAPP`.
  3. *Payment:* Transfer instructions provided upon confirmation.
  4. *Dispatch:* Stock is reduced and order is marked `PAID` upon verified transfer.
- **Action Button:** `CHAT WITH OWNER ON WHATSAPP` (Direct link pre-filled with `Halo, saya ingin konfirmasi pesanan #TSH-2026-XXXXXX`).

## Screen 6: Journal / Blog Listing (`/journal`) & Detail (`/journal/[slug]`)
- **Listing Page:** 2-column editorial layout with cover images, article title in Garamond, excerpt, and release date.
- **Detail Page:** Single-column centered reading layout (max-width 768px), high-contrast typography, pull quotes in Garamond italics, embedded related product card at bottom.

---

# 6. Public Catalogue vs. Admin Dashboard Protection Architecture

> [!CAUTION]
> **STRICT CODE CONSTRAINTS FOR DEVELOPERS:**
> 
> 1. **Do NOT edit existing UI components** in `components/dashboard/`, `components/ui/`, `components/layout/`, `components/shared/`, or dashboard pages.
> 2. **Do NOT modify global Tailwind rules** in `app/globals.css` in a way that overrides dashboard styles.
> 3. **Isolated Public Scoping:** Create public catalogue components inside a dedicated directory `components/catalogue/` (or `app/(catalogue)/`) and scope Stitch design tokens using scoped Tailwind classes or scoped CSS variables.

```text
rio-collection-catalogue/
├── app/
│   ├── (catalogue)/              <-- Public Stitch Catalogue Routes & Layout
│   │   ├── page.tsx              <-- Home
│   │   ├── catalogue/            <-- Catalogue
│   │   ├── archive/              <-- Archive
│   │   ├── products/[slug]/      <-- PDP
│   │   ├── order/                <-- Guest Checkout & Confirmation
│   │   └── journal/              <-- Brand Journal
│   └── (dashboard)/              <-- Admin Dashboard (UNTOUCHED)
│       └── admin/...
├── components/
│   ├── catalogue/                <-- NEW: Public Stitch Minimalist Components
│   │   ├── Navbar.tsx
│   │   ├── ProductCard.tsx
│   │   ├── OrderForm.tsx
│   │   ├── VariantSelector.tsx
│   │   └── ...
│   ├── dashboard/                <-- UNTOUCHED (Existing Dashboard Components)
│   └── ui/                       <-- UNTOUCHED (Existing Dashboard UI Primitives)
└── docs/
    ├── tshirt_catalogue_order_management_prd.md
    └── DESIGN_SYSTEM_UI_UX.md
```

---

# 7. Summary & Handoff Checklist

- [x] PRD moved into `rio-collection-catalogue/docs/tshirt_catalogue_order_management_prd.md` and root.
- [x] Complete Design System & UI/UX specification document created based on PRD & Stitch minimalist designs.
- [x] Exact colors, typography, layout, component rules, and screen-by-screen specs defined.
- [x] Isolated architecture established to guarantee dashboard components remain 100% untouched.
