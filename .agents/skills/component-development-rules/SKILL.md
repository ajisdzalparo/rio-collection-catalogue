---
name: component-development-rules
description: Essential guidelines and standards for inspecting existing codebase structure before creating or modifying components, hooks, API routes, performance optimizations, and SEO implementation in RIO Collection Catalogue.
---

# COMPONENT, HOOK, & API DEVELOPMENT RULES

This document serves as the mandatory operational standard for developers and AI agents working on the `rio-collection-catalogue` codebase.

---

# 1. MANDATORY PRE-CREATION DISCOVERY PROTOCOL

Before writing ANY new component, hook, utility, state store, or API route, you **MUST** complete the following discovery steps:

### Step 1.1: Inspect Existing Directory Structure
- Scan `components/`, `hooks/`, `features/`, `lib/`, `types/`, and `app/` to understand existing code organization.
- Do NOT make assumptions about file paths or pre-existing utilities.

### Step 1.2: Search for Duplicate Capabilities
- Use grep/search tools to check if the component, hook, or helper already exists (e.g. `use-mobile.ts`, `clsx` / `cn()` utility in `lib/utils.ts`, theme toggles, query providers).
- Re-use existing primitives instead of re-inventing duplicate code.

### Step 1.3: Respect Architectural & Domain Boundaries
- **Admin Dashboard (`components/dashboard/`, `components/ui/`):** Reserved strictly for the admin dashboard. **DO NOT modify** or pollute existing dashboard components with public catalogue styles.
- **Public Catalogue (`components/catalogue/`, `app/(catalogue)/`):** Dedicated space for the Stitch minimalist public T-shirt catalogue & journal.
- **Shared Primitives (`components/shared/`, `lib/`):** Generic, domain-agnostic UI helpers.

---

# 2. COMPONENT DESIGN & CREATION STANDARDS

## 2.1 File Naming & Organization
- Use **kebab-case** for file names (e.g., `product-card.tsx`, `variant-selector.tsx`, `order-summary.tsx`).
- One component per file. Place co-located sub-components in a subfolder if they exceed ~200 lines.
- Prefer **named exports** over default exports for components (e.g., `export function ProductCard()`).

## 2.2 Modular & Single Responsibility
- Keep components focused and under 250 lines of code.
- Separate UI presentation from data fetching or complex state logic. Move non-trivial logic into custom hooks (`hooks/`).

## 2.3 Strict TypeScript & Props Typing
- Define clear, explicit interfaces for component props:
  ```tsx
  interface ProductCardProps {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    status: 'AVAILABLE' | 'OUT_OF_STOCK';
    slug: string;
  }
  ```
- Do NOT use `any`. Import shared domain types from `@/types` or feature types.

## 2.4 Styling & Scoping Guidelines
- Use Tailwind CSS classes.
- Use `cn()` from `@/lib/utils` for conditional class joining.
- Maintain **0px sharp corners** (`rounded-none`) for public catalogue elements as defined in `DESIGN_SYSTEM_UI_UX.md`.

---

# 3. HOOKS & STATE MANAGEMENT CONVENTIONS

## 3.1 Custom Hooks
- Store custom hooks in `hooks/` (or `features/[feature_name]/hooks/`).
- File names must follow `use-[name].ts` format (e.g., `use-product-filter.ts`, `use-order-form.ts`).
- Hooks must encapsulate business logic, form handling, or reactive state, returning a clean API object.

## 3.2 State Management Hierarchy
1. **Component Local State (`useState`):** Use for UI toggle states (modals, dropdown open/close, active tab).
2. **Global Client State (`zustand`):** Use `zustand` for cross-component client state (e.g., guest cart drawer, user preferences). Keep stores small and single-purpose in `lib/store/`.
3. **Server & Async State (`@tanstack/react-query`):** Use React Query for all asynchronous API fetching, mutations, caching, and cache invalidation.

---

# 4. API ROUTES & BACKEND CONVENTIONS

## 4.1 Route Location & Naming
- Next.js App Router API routes must reside in `app/api/.../route.ts`.
- Use explicit HTTP method exports: `export async function GET(request: Request)`, `export async function POST(request: Request)`.

## 4.2 Security & Server-Side Validation
- **Never trust client input:** Always validate incoming JSON request bodies using `zod` schemas.
- **Backend Single Source of Truth:** Prices, stock levels, and order statuses must be calculated/retrieved from the server database, never accepted directly from client payloads.
- **Rate Limiting & Spam Protection:** Validate Turnstile CAPTCHA tokens and apply IP/session rate limits on public order endpoints (`POST /api/orders`).

## 4.3 Standardized API Responses
Return standardized JSON structures:
```ts
// Success
return NextResponse.json({ success: true, data: result }, { status: 200 });

// Error
return NextResponse.json({ success: false, error: 'Validation failed', details }, { status: 400 });
```

---

# 5. PERFORMANCE OPTIMIZATION BEST PRACTICES

## 5.1 Server Components First (RSC)
- Default to **React Server Components (RSC)** for pages and layout containers.
- Only add `'use client'` at the very top of files that require browser APIs (`useState`, `useEffect`, `framer-motion`, event listeners).
- Push `'use client'` directives as far down the component tree as possible (leaf node components).

## 5.2 Next.js Image Optimization
- Always use `<Image />` from `next/image` for product photos and article assets.
- Explicitly define `width`, `height`, `alt`, and `sizes` attributes for responsive srcset loading.
- Enable `priority` attribute only on above-the-fold hero images.

## 5.3 Dynamic Imports & Code Splitting
- Use `next/dynamic` for heavy client components that are not needed on initial paint (e.g., Turnstile CAPTCHA widget, complex modal dialogs).

## 5.4 Computation & Callback Memoization
- Wrap expensive array filtering/sorting in `useMemo`.
- Wrap functions passed down to memoized child components in `useCallback`.

---

# 6. SEO & ACCESSIBILITY (a11y) BEST PRACTICES

## 6.1 Metadata API Configuration
Every public route in `app/` must export static or dynamic metadata:

```tsx
// Static Metadata
export const metadata: Metadata = {
  title: 'RIO COLLECTION — Limited Archival T-Shirt Catalogue',
  description: 'Discover limited T-shirt drops, archival past designs, and brand stories.',
  openGraph: {
    title: 'RIO COLLECTION',
    description: 'Independent limited T-shirt brand & archival catalogue.',
    images: ['/og-image.jpg'],
  },
};

// Dynamic Metadata (e.g., Product Detail Page)
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  return {
    title: `${product.name} — RIO COLLECTION`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.imageUrl],
    },
  };
}
```

## 6.2 Semantic HTML & Heading Hierarchy
- Maintain strict heading hierarchy: exactly **one `<h1>` per page**, followed sequentially by `<h2>`, `<h3>`.
- Use HTML5 landmark elements: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.

## 6.3 Structured Data (JSON-LD)
- Embed Schema.org JSON-LD scripts for Product pages (`schema.org/Product`) and Journal articles (`schema.org/BlogPosting`) to maximize rich snippet indexing.

## 6.4 Accessibility Compliance
- Every interactive element (buttons, links, inputs) must have accessible names (`aria-label` or visual text).
- Form inputs must be explicitly associated with `<label>` tags.
- High contrast typography adhering to WCAG AA standards.

---

# 7. ARCHITECTURAL CHECKLIST FOR DEVELOPERS

```text
[ ] Did you inspect existing components and hooks before creating a new one?
[ ] Is the component located in the correct directory (catalogue vs dashboard)?
[ ] Are filenames using kebab-case?
[ ] Is the component typed with explicit TypeScript interfaces (no `any`)?
[ ] Is `'use client'` used only when necessary on leaf components?
[ ] Are images rendered via `next/image` with proper alt text and sizes?
[ ] Does the page export proper Next.js metadata for SEO?
[ ] Are form inputs validated with Zod on both client and server?
```
