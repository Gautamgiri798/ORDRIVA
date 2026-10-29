# ORDRIVA POS - Product Requirements Document (PRD)

## 1. Product Vision
ORDRIVA is an enterprise-ready, offline-resilient restaurant operations and Point of Sale (POS) platform designed to streamline billing, kitchen order execution, floor management, menu catalogs, recipe-based inventory, and financial reporting.

## 2. Target Personas
1. **Owner / Executive**: High-level sales performance, profit margins, branch comparisons, tax compliance.
2. **Branch Manager**: Staff roles, discounts, floor layout, menu pricing, stock adjustments, end-of-day reconciliation.
3. **Cashier**: High-speed touch POS terminal, split payments, cash change calculation, UPI QR generation, instant thermal receipt printing.
4. **Waiter**: Table status monitoring, fast mobile/tablet order taking, customer modifiers, real-time ticket tracking.
5. **Kitchen Chef**: Kitchen Display System (KDS), station routing (Kitchen, Bar, Grill), preparation timers, bumping tickets.
6. **Inventory Manager**: Stock receiving, raw ingredient tracking, recipe bill-of-materials, waste logging, minimum reorder thresholds.
7. **Customer**: QR code menu viewing, contactless ordering, digital GST receipts.

## 3. Feature Priorities
* **P0 (MVP - Core Release)**:
  * Full Authentication & Role-Based Access Control (RBAC).
  * Branch and organization configuration (GSTIN, currency, tax rates).
  * Menu catalog with categories, variants, and modifiers.
  * Interactive floor & dining table management.
  * Order lifecycle: Dine-in, Takeaway, Delivery.
  * Kitchen Display System (KDS) & Kitchen Order Tickets (KOT).
  * Billing with GST breakdown (CGST + SGST), discounts, and service charges.
  * Multi-method payment processing (Cash, UPI QR, Card, Split).
  * Recipe-based inventory tracking and automatic consumption.
  * Comprehensive analytics, X/Z cashier closing reports, and audit trail.
* **P1 (Next Release)**:
  * QR contactless self-ordering.
  * Customer CRM & loyalty rewards program.
  * Supplier purchase order lifecycle.
  * Direct thermal printer integration (ESC/POS).
* **P2 (Future)**:
  * Multi-branch centralized analytics and inventory transfers.
  * AI-powered demand forecasting and food-waste reduction.

## 4. Key Business Rules
1. Orders belong strictly to a single organization and branch.
2. Order items snapshot unit price, tax rate, and modifiers at the moment of order placement.
3. Order state (`draft` -> `placed` -> `preparing` -> `ready` -> `served` -> `completed`) is independent of payment status.
4. Financial mutations are idempotent and append-only.

