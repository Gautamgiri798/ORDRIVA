# ORDRIVA - Restaurant POS & Management System

> **Enterprise-Ready, High-Performance, Offline-Resilient Point of Sale & Operations Platform**  
> Architected according to the **Restaurant POS Product & Engineering Blueprint (v1.0)**.

---

## 🍽️ Overview

**ORDRIVA** connects the dining room floor, cashier counter, kitchen stations, recipe inventory, and executive reporting into a unified, high-performance system. Designed as a **modular monolith** with multi-tenant and branch-scoped architecture, ORDRIVA provides sub-300ms operational responsiveness and rock-solid financial integrity.

### 🌟 Key Feature Modules

1. **Cashier / POS Terminal (`/pos`)**:
   - Touch-optimized design with minimum 40–44px targets and fluid category navigation.
   - Dietary badges (Veg/Non-veg), instant search, and customizable modifier groups (crust styles, toppings, dips, special kitchen notes).
   - Dynamic real-time cart with table selection, customer details, and discount percentage selectors.
   - Comprehensive GST tax engine (Central GST + State GST + Dine-in Service Charge).
   - Multi-method rapid settlement:
     - **Cash**: Smart denomination shortcuts (₹500, ₹1000, ₹2000, Exact) with real-time Change Due calculator.
     - **Dynamic UPI QR**: Real-time generation of standard NPCI UPI QR codes compatible with GPay, PhonePe, Paytm.
     - **Card Terminals (EDC)** & **Split Bill Payments**.
   - Printable 80mm thermal receipt & tax invoice formatting conforming to GST standards.

2. **Kitchen Display System (KDS) (`/kitchen`)**:
   - 3-Column Kanban board: **New Tickets**, **Cooking Now**, **Ready for Pickup**.
   - Live ticket aging counter with chromatic threshold alerts (Green `<10m`, Amber `10–20m`, Red `>20m` urgent).
   - Station routing tabs: *All Stations*, *Kitchen*, *Grill & Fryer*, *Bar & Drinks*.
   - Web Audio chime toggle for real-time order alerts.

3. **Floor & Dining Table Management (`/tables`)**:
   - Visual floor map divided into sections (*Main Dining*, *Garden Terrace*, *VIP Lounge*).
   - Real-time occupancy states: **Available**, **Occupied**, **Reserved**, **Billed**.
   - Live dine-in timers and 1-click order initiation directly into the POS.

4. **Menu Catalog & Pricing (`/menu`)**:
   - Category management and dish catalog.
   - One-touch availability toggles (*In Stock* vs. *Sold Out*) with instant POS synchronization.

5. **Recipe-Based Inventory (`/inventory`)**:
   - Raw ingredient ledger tracking units (`kg`, `g`, `l`, `pcs`) and unit costs.
   - Automatic recipe consumption: settling an order automatically decrements ingredients from inventory based on recipe bill-of-materials.
   - Low-stock warning banners when inventory dips below minimum reorder thresholds.
   - Stock movement logger for inward supplier deliveries and wastage/spoilage.

6. **Sales, Taxes & GST Reports (`/reports`)**:
   - Gross Sales, Net Sales, Average Order Value (AOV), Total Discounts, and GST collections.
   - Payment collection channel breakdown (UPI vs. Cash vs. Card).
   - Top-performing dishes ranked by portions and revenue.
   - End-of-Day (Z-Report) cashier register closing summary.
   - Instant CSV export.

7. **Append-Only Security Audit Trail (`/audit`)**:
   - Immutable audit logs capturing staff actions, role keys, timestamps, and payload snapshots.

8. **Settings & GST Compliance (`/settings`)**:
   - Branch settings, GSTIN details, configurable CGST/SGST and service charge rates.
   - 80mm / 58mm thermal printer formatting.

---

## 🏗️ Repository Architecture (Monorepo)

```
ORDRIVA/
├── apps/
│   ├── web/                     # Next.js 15 App Router Frontend (POS, KDS, Floor, Admin)
│   └── api/                     # Modular Monolith Backend (REST API + Socket.IO)
├── packages/
│   ├── contracts/               # Shared domain interfaces, DTOs & types
│   └── ui/                      # Shared design tokens & style helpers
├── prisma/
│   ├── schema.prisma            # PostgreSQL schema with UUIDs, NUMERIC(14,2) & indexes
│   └── seed.ts                  # Comprehensive restaurant seed dataset
├── docs/                        # Complete Engineering Documentation
│   ├── PRD.md                   # Product Requirements Document
│   ├── TRD.md                   # Technical Requirements Document
│   ├── ARCHITECTURE.md          # Architecture and System Flow
│   ├── DATABASE.md              # Database Schema & Entity Relationships
│   ├── API.md                   # REST API & Socket.IO Event Contracts
│   ├── SECURITY.md              # Security, RBAC & Idempotency Controls
│   ├── TESTING.md               # Quality Gates & Acceptance Test Matrix
│   └── RUNBOOK.md               # Operations & Disaster Recovery Runbook
├── docker-compose.yml           # PostgreSQL 16, Redis, API, and Web containers
├── package.json                 # Monorepo scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js LTS (v20+ or v22+)
- pnpm 10+ (or npm)

### 1. Run the Web Application (POS, KDS, Dashboard)
```bash
# In the root or inside apps/web:
cd apps/web
pnpm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser:
* **POS Terminal**: [http://localhost:3000/pos](http://localhost:3000/pos)
* **Kitchen Display**: [http://localhost:3000/kitchen](http://localhost:3000/kitchen)
* **Floor Plan**: [http://localhost:3000/tables](http://localhost:3000/tables)
* **Orders & Bills**: [http://localhost:3000/orders](http://localhost:3000/orders)
* **Menu Catalog**: [http://localhost:3000/menu](http://localhost:3000/menu)
* **Inventory**: [http://localhost:3000/inventory](http://localhost:3000/inventory)
* **Reports**: [http://localhost:3000/reports](http://localhost:3000/reports)
* **Settings**: [http://localhost:3000/settings](http://localhost:3000/settings)

### 2. Run the Backend API & Real-time Server (Optional)
```bash
cd apps/api
pnpm run dev
```
Runs the Express + Socket.IO server on **http://localhost:4000**.

### 3. Docker Compose (Full Stack)
```bash
docker-compose up -d
```
Starts PostgreSQL on port `5432`, Redis on `6379`, API on `4000`, and Web on `3000`.

---

## 🎨 Design System Tokens

| Token | Hex | Role |
| :--- | :--- | :--- |
| **Primary Navy** | `#172554` | Header, navigation background |
| **Primary Teal** | `#0F766E` | Primary action buttons, brand accents |
| **Success** | `#16A34A` | Settled payments, available tables, ready tickets |
| **Warning** | `#D97706` | In-progress prep, occupied tables |
| **Danger** | `#DC2626` | Low-stock alerts, voids, cancellations |
| **Surface** | `#F8FAFC` | Page background |
| **Text** | `#0F172A` | Primary typography (Inter) |
