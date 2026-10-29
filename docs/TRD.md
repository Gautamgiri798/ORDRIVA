# ORDRIVA POS - Technical Requirements Document (TRD)

## 1. Technical Stack
* **Frontend**: Next.js App Router (TypeScript, React 19 / 18), Tailwind CSS, shadcn/ui design patterns, Lucide icons.
* **Client State & Cache**: React Context / Zustand, TanStack Query, LocalStorage & IndexedDB for offline resilience.
* **Backend**: NestJS / Express modular architecture, TypeScript, Socket.IO for real-time events.
* **Database**: PostgreSQL 16 with Prisma ORM (`NUMERIC(14,2)` for financial calculations).
* **Caching & Jobs**: Redis for session cache, rate limiting, and pub/sub.
* **Monorepo Management**: pnpm workspaces + Turborepo.
* **Containerization**: Docker Compose for PostgreSQL, Redis, API, and Web frontend.

## 2. Architecture Principles
1. **Modular Monolith**: Clean boundaries between domain modules (Auth, Menu, Tables, Orders, Kitchen, Payments, Inventory, Reports, Audit).
2. **Financial Precision**: Zero floating-point arithmetic. All monetary values use exact decimal representation.
3. **Idempotency Keys**: All financial transactions and order submissions accept an `Idempotency-Key` header to prevent duplicate charges or double orders on network retries.
4. **Decoupled Realtime Events**: Database writes commit first, followed by event emission through WebSocket / Socket.IO (Transactional Outbox Pattern).
5. **Offline Graceful Degradation**: Local storage maintains active carts and offline queues, preventing data loss when connectivity fluctuates.
