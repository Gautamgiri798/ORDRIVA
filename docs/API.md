# ORDRIVA POS - API Contracts & Endpoints

Base URL: `/api/v1`

## 1. Authentication
* `POST /api/v1/auth/login`: User email & password authentication.
* `POST /api/v1/auth/refresh`: Session token refresh.
* `POST /api/v1/auth/logout`: Revoke active session.
* `GET  /api/v1/me`: Retrieve current authenticated user, role, and branch scope.

## 2. Menu Catalog
* `GET  /api/v1/branches/:branchId/menu`: Retrieve active menu items grouped by categories.
* `POST /api/v1/menu-items`: Create new menu item with pricing and modifier definitions.
* `PUT  /api/v1/menu-items/:id`: Update item details, pricing, or availability.

## 3. Floor & Dining Tables
* `GET  /api/v1/branches/:branchId/tables`: List all tables with capacity and occupancy status.
* `PATCH /api/v1/tables/:tableId/status`: Update table state (`available`, `occupied`, `reserved`, `billed`).

## 4. Orders & Billing
* `POST /api/v1/branches/:branchId/orders`: Create new order (supports `Idempotency-Key` header).
* `GET  /api/v1/branches/:branchId/orders`: Search and filter order list.
* `GET  /api/v1/orders/:orderId`: Retrieve full order details with snapshots.
* `PATCH /api/v1/orders/:orderId/status`: Transition order status.

## 5. Kitchen & KDS
* `GET   /api/v1/kitchen/tickets`: List active tickets across stations.
* `PATCH /api/v1/kitchen/tickets/:ticketId/status`: Update ticket preparation state.

## 6. Payments & Settlement
* `POST /api/v1/orders/:orderId/payments`: Process payment (Cash, UPI QR, Card, Split).
* `POST /api/v1/payments/:paymentId/refunds`: Issue refund against original transaction.

## 7. Inventory & Recipes
* `GET  /api/v1/branches/:branchId/inventory`: Current stock levels and low-stock alerts.
* `POST /api/v1/inventory/movements`: Log inward purchase, recipe consumption, or waste.

## 8. Reports & Audit
* `GET  /api/v1/reports/sales`: Aggregated sales metrics, tax totals, and top sellers.
* `GET  /api/v1/audit-events`: Search append-only audit trail.

