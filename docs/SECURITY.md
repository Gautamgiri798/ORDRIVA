# ORDRIVA POS - Security Architecture & Controls

## 1. Identity & Access Management
* **Password Hashing**: Modern Argon2id or bcrypt hashing with high work factor.
* **Session Management**: Branch-scoped JWTs or secure HTTP-only cookies.
* **Role-Based Access Control (RBAC)**: Centralized server-side enforcement. Cashiers cannot approve refunds or override discounts without manager authorization.

## 2. Financial Integrity
* **Idempotent Mutations**: Unique idempotency tokens required for order creation and payment settlement.
* **Double Spend Protection**: Atomic database transactions guarantee single settlement per order.
* **Auditing**: Every refund, void, and manual price edit writes an immutable `audit_events` record with timestamp and user ID.

## 3. Data Protection
* Strict branch isolation in all database queries prevents cross-branch / cross-tenant data leakage.
* Parameterized Prisma queries prevent SQL injection.
* Input validation via Zod schemas across both client and server boundaries.
