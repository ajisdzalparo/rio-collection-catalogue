<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# COMPONENT, HOOK & API DEVELOPMENT SKILLS & RULES

Before writing any new component, hook, utility, or API route in this project, you **MUST** follow the rules defined in the `.agents/skills/component-development-rules/SKILL.md` skill.

### Core Mandatory Directives:

1. **Pre-Creation Discovery:** Always inspect `components/`, `hooks/`, `features/`, `lib/`, and `app/` to check for existing components and hooks before creating a new one. Do NOT re-invent existing utilities or UI primitives.
2. **Domain Isolation:** Do NOT modify existing dashboard components in `components/dashboard/` or `components/ui/`. Public catalogue components belong in `components/catalogue/`.
3. **Naming & Structure:** Use `kebab-case` for file names, typed TypeScript interfaces (no `any`), and keep components modular and under 250 lines.
4. **Performance:** Default to React Server Components (RSC) in `app/`. Only use `'use client'` at the leaf nodes. Use `next/image` for image optimization.
5. **SEO & Accessibility:** Export `metadata` or `generateMetadata()` on all public routes, use semantic HTML tags (`<header>`, `<main>`, `<article>`), and ensure proper ARIA attributes.
