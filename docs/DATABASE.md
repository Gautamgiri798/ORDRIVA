# ORDRIVA POS - Database Design & Schema Reference

## Overview
The ORDRIVA database runs on PostgreSQL 16 managed via Prisma ORM.

### Key Tables
1. **organizations**: Multi-tenant group account.
2. **branches**: Location-specific configurations, GSTIN, currency, and tax settings.
3. **users & memberships**: Staff accounts with role assignments scoped to specific branches.
4. **menu_categories & menu_items**: Hierarchical catalog with tax categories, stations, and modifier groups.
5. **dining_tables**: Floor plan tables with capacity, section, and occupancy state.
6. **orders & order_items**: Transactional orders with immutable price, tax, and modifier snapshots.
7. **kitchen_tickets**: Kitchen order routing by station (kitchen, grill, bar) with timestamp lifecycle.
8. **payments & refunds**: Payment ledger with methods (cash, UPI, card, split), tendered amounts, and provider references.
9. **inventory_items & stock_movements**: Stock levels, reorder thresholds, and auditable movement logs.
10. **recipe_items**: Bill of materials mapping menu items to raw inventory consumption.
11. **audit_events**: Append-only log recording actor, action, timestamp, and metadata for compliance.
12. **outbox_events**: Guaranteed event delivery pattern for webhooks and real-time broadcasts.
