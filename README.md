<div align="center">

  <img src="apps/web/public/ordriva-logo.svg" alt="ORDRIVA Logo" width="460" />

  <br />
  <br />

  <p align="center">
    <strong>Enterprise Restaurant Operating System, Touch POS, KDS & Contactless Dining Platform</strong>
  </p>

  <p align="center">
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
    <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://www.prisma.io"><img src="https://img.shields.io/badge/Prisma-6.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma ORM" /></a>
    <a href="https://www.postgresql.org"><img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
    <a href="https://socket.io"><img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socketdotio" alt="Socket.IO" /></a>
    <img src="https://img.shields.io/badge/GST-Ready-16A34A?style=for-the-badge" alt="GST Ready" />
  </p>

  <p align="center">
    <a href="#-core-modules">Core Modules</a> •
    <a href="#-customer-ordering-site">Customer QR Portal</a> •
    <a href="#-management--admin-portal">Admin Console</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-color-system">Design System</a>
  </p>

  <hr />
</div>

## 📌 Executive Summary

**ORDRIVA** connects the dining floor, touch cashier counters, kitchen prep lines, recipe inventory ledgers, and financial tax audits into a unified, high-performance platform. 

Architected according to the **Restaurant POS Product & Engineering Blueprint (v1.0)**, ORDRIVA is built as an offline-resilient **modular monolith** with multi-tenant and branch-scoped data isolation, sub-300ms cashier responsiveness, and strict decimal financial precision (`NUMERIC(14,2)`).

---

## 🌟 Key Feature Highlights

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ORDRIVA RESTAURANT OS                           │
├────────────────────┬────────────────────┬──────────────────────────────┤
│  ADMIN & OPERATING │  STAFF & CASHIER   │  CUSTOMER EXPERIENCE         │
│  • Executive KPI   │  • Touch POS       │  • QR Contactless Dining     │
│  • Inventory BoM   │  • KDS Kanban      │  • Live Ticket Stepper       │
│  • Tax & GST Audit │  • Table Seating   │  • Table UPI QR Checkout     │
│  • Branch Settings │  • 80mm Bill Print │  • Dietary (Pure Veg) Filter │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

---

## 🍽️ Core Modules

### 1. ⚡ Touch Cashier POS Terminal (`/pos`)
* **Touch-Optimized Workflow:** Large ergonomic tap targets (40–44px minimum) designed for high-throughput counter rush hours.
* **Smart Item Customization:** Modal-based modifier options (pizza crusts, dips, cooking temperature, extra toppings) with automatic price delta adjustments.
* **GST & Tax Engine:** Automated dual tax calculation (CGST + SGST + Dine-in Service Charge) with decimal rounding.
* **Instant Multi-Method Settlement:**
  * **Cash**: Smart currency denomination shortcuts (₹500, ₹1000, ₹2000, Exact) with real-time Change Tendered calculator.
  * **Dynamic UPI QR**: On-the-fly NPCI UPI QR code generation compatible with Google Pay, PhonePe, Paytm, and BHIM.
  * **Cards & Split Billing**: Support for electronic payment terminal verification and multi-tender splits.
* **80mm Thermal Receipt Printing:** Browser and serial printer-ready monochrome tax invoices formatted to GST statutory guidelines.

### 2. 👨‍🍳 Kitchen Display System (KDS) (`/kitchen`)
* **3-Column Kanban Board:** Real-time ticket lifecycle tracking: **New Orders**, **In Preparation**, and **Ready for Pickup**.
* **Station Routing:** Filter orders by kitchen station (*All Stations*, *Hot Kitchen*, *Grill & Fryer*, *Bar & Beverage*).
* **Chromatic Aging Thresholds:** Visual indicators alert chefs to ticket delays (Green `<10m`, Amber `10–20m`, Red `>20m` urgent).
* **Web Audio Sound Chime:** Audible notification triggers when new orders are placed via POS or Customer QR.

### 3. 🪑 Floor Plan & Table Management (`/tables`)
* **Sectioned Floor Layout:** Visualize dining spaces across *Main Dining Room*, *Garden Terrace*, and *VIP Lounge*.
* **Live Occupancy Statuses:** Track table states in real time: `Available` (Vacant), `Occupied`, `Reserved`, or `Billed`.
* **Elapsed Dining Timers:** Monitor guest seating duration and launch POS orders with one click.

### 4. 📦 Recipe-Based Stock & Inventory (`/inventory`)
* **Bill-of-Materials (BoM) Auto-Deduction:** Settling an order automatically deducts raw ingredient portions from inventory.
* **Stock Alert Banners:** Instant notification when ingredients dip below minimum safe reorder thresholds.
* **Wastage & Inward Movement Ledger:** Log supplier restock shipments, damaged goods, or prep waste with reason codes.

### 5. 📊 Sales, Taxes & GST Analytics (`/reports`)
* **Executive Metrics:** Today's Gross Sales, Net Sales, Average Order Value (AOV), and Tax Collections.
* **Tender Breakdown:** Collection channel ratios (UPI vs. Cash vs. Credit/Debit Cards).
* **Top Selling Dishes:** Performance ranking by portions sold and revenue contribution.
* **End-of-Day (Z-Report):** Instant shift closing register reconciliation and one-click CSV report export.

### 6. 🛡️ Immutable Security Audit Trail (`/audit`)
* **Append-Only Event Ledger:** Captures manager overrides, order cancellations, manual discounts, and price mutations with actor IDs, roles, and timestamps.

---

## 📱 Customer Ordering Site (`/order`)

Designed as a mobile-first digital dining portal for restaurant patrons scanning table QR codes:

* **Contactless Dining Menu:** Browse appetizers, mains, beverages, and desserts directly on smartphone browsers.
* **Table Identification:** Auto-detects table assignment from URL parameters (e.g., `?table=T-03`).
* **Interactive Modifiers & Floating Cart:** Customize ingredients and add cooking notes for the chef.
* **One-Click KDS Dispatch:** Orders push instantly to kitchen stations and mark table occupancy.
* **Live Status Stepper:** Real-time visual progress tracking (**Order Placed** &rarr; **In Kitchen** &rarr; **Ready** &rarr; **Served**).
* **Table UPI Payments:** Patrons can scan the dynamic UPI QR code at their table to settle bills without waiting for a waiter.

---

## 👑 Management & Admin Portal

* **Root Administrator Console:** Dedicated to restaurant owners and administrators (**Vikram Malhotra**).
* **Glassmorphic Navigation Bar:** Obsidian dark header (`#0B1120`) accented with vibrant Electric Blue (`#3B82F6`).
* **Custom Admin Profile Popover:** Quick-action shortcuts for branch configuration, GST percentage tuning, and audit trails without unstyled OS menus.
* **Multi-Branch Switcher:** Toggle between multiple restaurant outlets (*Downtown Bistro* vs. *Sky Lounge Aerocity*).

---

## 🎨 Color System & Design Tokens

Configured in `tailwind.config.ts` and `globals.css`:

| Token | Hex Code | Visual Preview | Application & Role |
| :--- | :---: | :---: | :--- |
| **Primary Blue** | `#3B82F6` | ![#3B82F6](https://via.placeholder.com/14/3B82F6/3B82F6.png) | Primary action buttons, active navigation states, POS checkout |
| **Sky Blue Accent** | `#60A5FA` | ![#60A5FA](https://via.placeholder.com/14/60A5FA/60A5FA.png) | Subtitles, interactive glows, hover states, status pills |
| **Violet Accent** | `#A78BFA` | ![#A78BFA](https://via.placeholder.com/14/A78BFA/A78BFA.png) | Administrator role badges, special KPI cards, sparkles |
| **Header Surface** | `#0B1120` | ![#0B1120](https://via.placeholder.com/14/0B1120/0B1120.png) | Top glassmorphic navigation bar and dark modals |
| **Canvas Background** | `#F8FAFC` | ![#F8FAFC](https://via.placeholder.com/14/F8FAFC/F8FAFC.png) | Clean, high-contrast light workspace for staff readability |
| **Success Emerald** | `#16A34A` | ![#16A34A](https://via.placeholder.com/14/16A34A/16A34A.png) | Settled bills, available tables, healthy inventory |
| **Warning Amber** | `#D97706` | ![#D97706](https://via.placeholder.com/14/D97706/D97706.png) | Occupied dining tables, kitchen tickets aging >10m |
| **Danger Rose** | `#DC2626` | ![#DC2626](https://via.placeholder.com/14/DC2626/DC2626.png) | Low-stock alerts, voids, and overdue kitchen orders |

---

## 🏗️ Repository Architecture

```
ORDRIVA/
├── apps/
│   ├── web/                     # Next.js 15 App Router Frontend
│   │   ├── src/app/
│   │   │   ├── page.tsx         # Executive Overview Dashboard
│   │   │   ├── pos/             # Touch Cashier POS Terminal
│   │   │   ├── kitchen/         # KDS Kanban & Station Routing
│   │   │   ├── tables/          # Visual Floor Map & Table Manager
│   │   │   ├── order/           # Customer Digital Dining & QR Menu
│   │   │   ├── orders/          # Historical Orders & Tax Invoices
│   │   │   ├── menu/            # Menu Catalog & Availability
│   │   │   ├── inventory/       # Recipe BoM & Stock Movements
│   │   │   ├── reports/         # Financials, Taxes & Z-Report
│   │   │   ├── audit/           # Security Audit Trail
│   │   │   └── settings/        # GSTIN, Tax Rates & Printer Settings
│   │   └── public/              # High-Res Vector Logos & Favicons
│   │
│   └── api/                     # Modular Monolith Backend
│       └── src/main.ts          # Express REST API + Socket.IO Server
│
├── prisma/
│   ├── schema.prisma            # PostgreSQL Schema (UUIDs, Decimals)
│   └── seed.ts                  # Comprehensive Bistro & Grill Dataset
│
├── docs/                        # Complete Architecture Documentation
│   ├── PRD.md                   # Product Requirements Document
│   ├── TRD.md                   # Technical Requirements Document
│   ├── ARCHITECTURE.md          # Architecture and System Dataflow
│   ├── DATABASE.md              # Database Schema & Entity Relationships
│   ├── API.md                   # REST API & Socket.IO Contracts
│   ├── SECURITY.md              # Security, RBAC & Idempotency Controls
│   ├── TESTING.md               # Test Matrix & Acceptance Gates
│   └── RUNBOOK.md               # Operations & Disaster Recovery Guide
│
├── docker-compose.yml           # Multi-Container Compose Configuration
└── package.json                 # Monorepo Workspace Configuration
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v20.x or higher
* **Package Manager**: `pnpm` (recommended) or `npm`
* **Database**: PostgreSQL 16 (or Docker)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ordriva.git
cd ordriva

# Install monorepo dependencies
pnpm install
```

### 2. Start the Frontend Application (Web & POS)

```bash
cd apps/web
pnpm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

#### Direct Navigation Links:
| Portal / View | Local URL | Target User |
| :--- | :--- | :--- |
| **Admin Overview** | `http://localhost:3000` | Owner / Administrator |
| **Cashier Touch POS** | `http://localhost:3000/pos` | Cashier / Billing Staff |
| **Kitchen KDS** | `http://localhost:3000/kitchen` | Chef / Kitchen Line |
| **Customer QR Menu** | `http://localhost:3000/order` | Dining Patrons |
| **Floor & Tables** | `http://localhost:3000/tables` | Host / Floor Manager |
| **Inventory & Stock** | `http://localhost:3000/inventory` | Inventory Manager |
| **GST & Sales Reports** | `http://localhost:3000/reports` | Accountant / Owner |

### 3. Start the Backend API Server (Optional)

```bash
cd apps/api
pnpm run dev
```
API server listens on **[http://localhost:4000](http://localhost:4000)** (`GET /api/v1/health`).

### 4. Running with Docker Compose (Full Stack)

```bash
# Starts PostgreSQL (5432), Redis (6379), API (4000), and Next.js Web (3000)
docker-compose up -d
```

---

## 📄 License & Attribution

ORDRIVA is engineered for enterprise culinary and hospitality operations. Released under the **MIT License**.
All brand identities, trademarks, and logos are property of their respective owners.
