
# Devgn PerformX — Build Plan

The full scope you described (landing + auth + 3 dashboards + 12 department modules + performance engine + tasks + AI assistant + reporting + exports) is a multi-month enterprise build. I'll deliver it in phases so each ships polished, not half-built. Below is **Phase 1**, which establishes the brand system and the most visible surfaces. I'll confirm scope before continuing to later phases.

## Design system (foundational, used everywhere)

- Matte black base `#050505`, surface `#0A0A0A`, elevated `#111111`
- Metallic gold `#D4AF37` with lighter `#E8C66B` and deep `#9A7B22` for gradients
- Typography: **Cinzel** (display, cinematic serif matching the logo) + **Inter** (body)
- Glassmorphism cards: `backdrop-blur`, gold 1px borders at 20% opacity, gold glow shadows
- Gold gradient utilities, glow rings, shimmer animation, cinematic fade/slide-up transitions via Framer Motion
- Logo copied to `src/assets/devgn-logo.png` and used in nav/auth/sidebar
- All tokens in `src/styles.css` (oklch) — no hardcoded colors in components

## Phase 1 deliverables

### 1. Landing page (`/`)
Cinematic single page with: sticky glass nav, hero with animated dashboard mockup + gold glow + tagline "AI-Powered Workforce Intelligence", features grid (6 cards), department analytics showcase, KPI tracking showcase with live-style charts, AI insights section, executive dashboard preview image, CTA band, footer. Smooth scroll, scroll-triggered reveals.

### 2. Auth (`/login`, `/signup`, `/forgot-password`)
Split-screen luxury layout: logo + brand panel on left, glass form card on right. Role selector on signup (Super Admin / HOD / Team Lead / Employee). Frontend-only role routing for now (mock auth stored in localStorage) — real JWT auth comes in Phase 2 when we enable Lovable Cloud.

### 3. App shell (`/app/*`)
- Collapsible gold-accented sidebar (logo, role-aware nav)
- Top bar with search, notifications, profile
- Dark luxury layout wrapping all dashboards

### 4. Three role dashboards (functional with mock data)
- **Executive** (`/app/executive`): company health score ring, dept comparison bar chart, revenue line chart, workforce productivity, KPI overview cards, attendance area chart, employee distribution donut, monthly trends, AI summary card
- **HOD** (`/app/hod`): team performance overview, employee rankings table, KPI tracking, task monitoring, attendance, pending approvals, notifications, team productivity
- **Employee** (`/app/employee`): personal KPI score ring, assigned tasks list, attendance widget, performance trend chart, goals progress, monthly report card

Charts via **Recharts**, animations via **Framer Motion**, all rendered with mock data so the UI feels alive.

## Phase 2 (after Phase 1 approval)
- Enable Lovable Cloud → real auth (JWT via Supabase), users/roles tables, RLS
- 12 department modules (HR, Projects, Finance, Marketing, IT, Legal, Operations, CRM, Procurement, Admin, Sales, Hospitality) each with KPI dashboard + employee list + reports
- Task management Kanban with assignments, deadlines, comments
- Employee performance engine with weighted scoring

## Phase 3
- AI assistant chatbot (Lovable AI Gateway, Gemini) answering workforce questions
- AI-generated monthly summaries, burnout/anomaly detection, predictions
- Reporting system with PDF/Excel/CSV export
- Heatmaps, advanced analytics

## Tech notes (technical)
Project is TanStack Start (not Next.js as you listed — Lovable's React stack). Tailwind v4, shadcn/ui, Framer Motion, Recharts. Backend via Lovable Cloud (Supabase + edge) rather than separate FastAPI — same Postgres + JWT outcome, zero infra setup. AI via Lovable AI Gateway (Gemini default, OpenAI available) instead of direct OpenAI keys.

---

**Confirm to proceed with Phase 1** (landing + auth + 3 dashboards with mock data, ~the most visual 30% of the platform). Reply with any tweaks (e.g. skip landing, start with dashboards, different role to prioritize) before I build.
