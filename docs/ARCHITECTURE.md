# ORDRIVA POS - Architecture & System Design

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  [ POS Terminal ]    [ Admin Dashboard ]    [ Kitchen Display ]    [ QR Menu ]    |
+-----------------------------------------------------------------------------------+
                                         |
                                (HTTPS / WSS)
                                         v
+-----------------------------------------------------------------------------------+
|                               APPLICATION GATEWAY                                 |
|               Validation  |  Authentication  |  Authorization  |  Rate Limiting   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                            MODULAR MONOLITH CORE                                  |
|                                                                                   |
|  +--------------------+  +--------------------+  +--------------------+          |
|  | Auth & Users       |  | Menu & Catalog     |  | Tables & Floor     |          |
|  +--------------------+  +--------------------+  +--------------------+          |
|  +--------------------+  +--------------------+  +--------------------+          |
|  | Orders & Billing   |  | Kitchen (KDS/KOT)  |  | Payments & Refunds |          |
|  +--------------------+  +--------------------+  +--------------------+          |
|  +--------------------+  +--------------------+  +--------------------+          |
|  | Inventory & Recipes|  | Reports & Audit    |  | Outbox Publisher   |          |
|  +--------------------+  +--------------------+  +--------------------+          |
+-----------------------------------------------------------------------------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
             [ PostgreSQL Database ]              [ Redis Cache / PubSub ]
             (ACID, Prisma ORM)                   (Live Socket Coordination)
```

## Module Interactions
1. **Order Placement**:
   * POS terminal builds cart -> verifies prices server-side -> creates Order & OrderItem records with price snapshots.
   * Emits `kitchen.ticket_created` via WebSocket to the Kitchen Display System (KDS).
2. **Kitchen Workflow**:
   * KDS updates ticket status to `preparing` then `ready`.
   * Realtime socket event triggers notification on POS and Waiter tablets.
3. **Checkout & Settlement**:
   * Cashier processes payment (Cash, dynamic UPI QR, or Card).
   * Transaction validated -> payment record created -> order status moves to `completed`.
   * Automatic inventory consumption triggered: recipes deducted from raw stock.
   * GST invoice generated for printing or digital receipt.

