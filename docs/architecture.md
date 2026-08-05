# Architecture

The site uses Next.js App Router with locale-prefixed routes. Phase 1 includes a polished homepage and shared route shell for secondary pages.

Data is centralized in `src/data`, presentation lives in `src/components`, and external systems are represented by safe adapters in `src/lib`.

The project intentionally favors server components. Client components are limited to navigation and language switching where browser state and events are required.
