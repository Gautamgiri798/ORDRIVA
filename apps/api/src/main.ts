import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Security Hardening: Disable Express technology banner
app.disable('x-powered-by');

// Dynamic / Strict CORS origin validator (prevents unauthorized cross-origin requests)
const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Allow curl, health monitors, and server-to-server requests
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true;
  if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) return true;
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return true;
  return false;
};

const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Socket CORS blocked by policy'));
      }
    },
    methods: ['GET', 'POST', 'PATCH'],
  },
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  })
);

// Standard HTTP Security Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Enforce strict JSON body size (100kb is plenty for POS tickets, prevents memory DoS)
app.use(express.json({ limit: '100kb' }));

// In-Memory sliding window rate limiting
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

const createRateLimiter = (windowMs: number, maxRequests: number, endpointName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${endpointName}:${clientIp}`;
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({
        error: `Too many requests for ${endpointName}. Please wait before retrying.`,
      });
    }

    record.count += 1;
    next();
  };
};

const orderRateLimiter = createRateLimiter(60000, 40, 'order_creation');
const paymentRateLimiter = createRateLimiter(60000, 60, 'payment_processing');

// Zod Input Validation Schemas
const OrderItemInputSchema = z.object({
  id: z.string().optional(),
  menuItemId: z.string().min(1, 'menuItemId is required'),
  name: z.string().min(1, 'Item name is required').max(120),
  basePrice: z.number().min(0, 'basePrice cannot be negative'),
  quantity: z.number().int().min(1, 'quantity must be at least 1').max(99),
  taxRate: z.number().min(0).max(100).optional().default(5),
  notes: z.string().max(300).optional(),
  modifiers: z.array(z.any()).optional().default([]),
  itemTotal: z.number().optional(),
  taxTotal: z.number().optional(),
});

const CreateOrderSchema = z.object({
  id: z.string().optional(),
  orderNumber: z.number().int().positive().optional(),
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']).default('dine_in'),
  tableId: z.string().optional(),
  tableLabel: z.string().max(30).optional(),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(25).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
  items: z.array(OrderItemInputSchema).min(1, 'Order must contain at least 1 item'),
  paymentMethod: z.enum(['cash', 'card', 'upi']).optional().default('cash'),
  paymentStatus: z.enum(['pending', 'processing', 'succeeded', 'failed']).optional().default('pending'),
  tickets: z.array(z.any()).optional(),
});

const UpdateTicketStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'served', 'cancelled']),
});

const CreatePaymentSchema = z.object({
  method: z.enum(['cash', 'card', 'upi']),
  amount: z.number().positive('Payment amount must be greater than 0'),
  tenderedAmount: z.number().positive().optional(),
});

// In-Memory Database store seeded with ORDRIVA default branch
let currentBranch = {
  id: 'br-dt-01',
  name: 'ORDRIVA Bistro & Grill - Downtown',
  gstin: '07AABCO1234F1Z8',
  taxRates: { cgst: 2.5, sgst: 2.5, serviceCharge: 5.0 },
};

// Seed initial orders matching frontend demo baseline
let orders: any[] = [
  {
    id: 'ord-1001',
    branchId: 'br-dt-01',
    orderNumber: 1001,
    orderType: 'dine_in',
    status: 'completed',
    tableId: 'tbl-02',
    tableLabel: 'T-02',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    items: [
      { id: 'oi-1001-1', menuItemId: 'item-01', name: 'Truffle Burrata Pizza', basePrice: 650, quantity: 1, taxRate: 5, modifiers: [], itemTotal: 650, taxTotal: 32.5 },
      { id: 'oi-1001-2', menuItemId: 'item-09', name: 'Blueberry Basil Smash', basePrice: 240, quantity: 2, taxRate: 5, modifiers: [], itemTotal: 480, taxTotal: 24.0 },
    ],
    subtotal: 1130,
    discountTotal: 0,
    taxTotal: 56.5,
    cgst: 28.25,
    sgst: 28.25,
    serviceChargeTotal: 56.5,
    grandTotal: 1243,
    notes: 'Table 2 Anniversary Dinner',
    createdBy: 'usr-cashier',
    createdAt: new Date(Date.now() - 42 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 42 * 60000).toISOString(),
    paymentStatus: 'pending',
    paymentMethod: 'cash',
  },
  {
    id: 'ord-1002',
    branchId: 'br-dt-01',
    orderNumber: 1002,
    orderType: 'dine_in',
    status: 'placed',
    tableId: 'tbl-06',
    tableLabel: 'T-06',
    customerName: 'Priya Mehta',
    customerPhone: '+91 91234 56789',
    items: [
      { id: 'oi-1002-1', menuItemId: 'item-07', name: 'Avocado & Halloumi Burger', basePrice: 440, quantity: 2, taxRate: 5, modifiers: [], itemTotal: 880, taxTotal: 44.0 },
    ],
    subtotal: 880,
    discountTotal: 0,
    taxTotal: 44.0,
    cgst: 22.0,
    sgst: 22.0,
    serviceChargeTotal: 44.0,
    grandTotal: 968,
    createdBy: 'customer-qr',
    createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 60000).toISOString(),
    paymentStatus: 'pending',
    paymentMethod: 'upi',
  },
  {
    id: 'ord-1003',
    branchId: 'br-dt-01',
    orderNumber: 1003,
    orderType: 'dine_in',
    status: 'completed',
    tableId: 'tbl-08',
    tableLabel: 'T-08',
    customerName: 'Rohan Gupta',
    items: [
      { id: 'oi-1003-1', menuItemId: 'item-08', name: 'Grilled Norwegian Salmon', basePrice: 890, quantity: 2, taxRate: 5, modifiers: [], itemTotal: 1780, taxTotal: 89.0 },
    ],
    subtotal: 1780,
    discountTotal: 0,
    taxTotal: 89.0,
    cgst: 44.5,
    sgst: 44.5,
    serviceChargeTotal: 89.0,
    grandTotal: 1958,
    createdBy: 'usr-cashier',
    createdAt: new Date(Date.now() - 55 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    paymentStatus: 'succeeded',
    paymentMethod: 'card',
  },
];

let kitchenTickets: any[] = [];
let inventory: any[] = [
  { id: 'inv-01', name: 'Artisan Pizza Flour', unit: 'kg', currentStock: 74.2, minReorderLevel: 25.0, costPerUnit: 75.0 },
  { id: 'inv-02', name: 'Buffalo Mozzarella', unit: 'kg', currentStock: 16.8, minReorderLevel: 10.0, costPerUnit: 480.0 },
];
let auditEvents: any[] = [];

// Idempotency cache for preventing duplicate order submissions
const idempotencyStore = new Map<string, any>();

// ----------------------------------------------------
// REST API Endpoints
// ----------------------------------------------------

// 1. Health & Root Meta
app.get('/', (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>ORDRIVA API Server</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B1120; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #111C38; border: 1px solid rgba(59,130,246,0.35); border-radius: 24px; padding: 40px; max-width: 540px; text-align: center; }
        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(16,185,129,0.15); color: #34D399; border: 1px solid rgba(16,185,129,0.3); border-radius: 999px; font-size: 12px; font-weight: 700; margin-bottom: 20px; }
        h1 { font-size: 28px; margin: 0 0 12px; color: #FCD34D; }
        p { font-size: 14px; color: #94A3B8; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">● ORDRIVA API Server Online (Port 4000)</div>
        <h1>ORDRIVA BACKEND</h1>
        <p>REST API & Socket.IO Gateway operational. Frontend running on http://localhost:3000</p>
      </div>
    </body>
    </html>
  `);
});

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ORDRIVA POS API', version: '2.0.0', time: new Date().toISOString() });
});

// 2. Auth & User Scopes
app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  res.json({
    data: {
      accessToken: 'ordriva_jwt_token_sample',
      user: {
        id: 'usr-admin',
        name: 'Vikram Malhotra',
        email: email || 'admin@ordriva.com',
        role: 'admin',
        branchId: currentBranch.id,
      },
    },
  });
});

app.get('/api/v1/me', (_req: Request, res: Response) => {
  res.json({
    data: {
      id: 'usr-admin',
      name: 'Vikram Malhotra',
      role: 'admin',
      branchId: currentBranch.id,
    },
  });
});

// 3. Menu
app.get('/api/v1/branches/:branchId/menu', (_req: Request, res: Response) => {
  res.json({
    data: {
      branchId: currentBranch.id,
      categories: ['Starters', 'Pizzas', 'Burgers', 'Mains', 'Drinks', 'Desserts'],
      itemCount: 14,
    },
  });
});

// 4. Tables
app.get('/api/v1/branches/:branchId/tables', (_req: Request, res: Response) => {
  res.json({
    data: [
      { id: 'tbl-01', label: 'T-01', capacity: 2, status: 'available' },
      { id: 'tbl-02', label: 'T-02', capacity: 4, status: 'occupied' },
      { id: 'tbl-03', label: 'T-03', capacity: 4, status: 'available' },
    ],
  });
});

// 5. Orders (with Idempotency validation & complete item preservation)
app.post('/api/v1/branches/:branchId/orders', orderRateLimiter, (req: Request, res: Response) => {
  const idempotencyKey = req.header('Idempotency-Key');
  if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
    return res.status(200).json(idempotencyStore.get(idempotencyKey));
  }

  // Schema-level request validation
  const validationResult = CreateOrderSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      error: 'Invalid order payload',
      details: validationResult.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
  }

  const parsed = validationResult.data;

  // Determine next order number consistently
  const maxExistingNum = orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber || 0)) : 1000;
  const orderNumber = parsed.orderNumber || (maxExistingNum + 1);
  const orderId = parsed.id || `ord-${orderNumber}`;

  // Authoritative server-side price calculation (neutralizes client price-tampering CWE-602)
  let calculatedSubtotal = 0;
  const formattedItems = parsed.items.map((it, idx) => {
    const qty = it.quantity;
    const basePrice = Math.max(0, it.basePrice);
    const lineTotal = Math.round(basePrice * qty * 100) / 100;
    calculatedSubtotal += lineTotal;
    const taxRate = typeof it.taxRate === 'number' ? it.taxRate : 5;
    const taxTotal = Math.round(lineTotal * (taxRate / 100) * 100) / 100;

    return {
      id: it.id || `oi-${orderId}-${idx + 1}`,
      menuItemId: it.menuItemId,
      name: it.name,
      basePrice,
      quantity: qty,
      taxRate,
      modifiers: it.modifiers || [],
      itemTotal: lineTotal,
      taxTotal,
      notes: it.notes || '',
    };
  });

  calculatedSubtotal = Math.round(calculatedSubtotal * 100) / 100;
  const cgst = Math.round(((calculatedSubtotal * currentBranch.taxRates.cgst) / 100) * 100) / 100;
  const sgst = Math.round(((calculatedSubtotal * currentBranch.taxRates.sgst) / 100) * 100) / 100;
  const serviceChargeTotal = parsed.orderType === 'dine_in'
    ? Math.round(((calculatedSubtotal * currentBranch.taxRates.serviceCharge) / 100) * 100) / 100
    : 0;
  const grandTotal = Math.round((calculatedSubtotal + cgst + sgst + serviceChargeTotal) * 100) / 100;

  const newOrder = {
    id: orderId,
    branchId: req.params.branchId || currentBranch.id,
    orderNumber,
    orderType: parsed.orderType,
    status: 'placed',
    tableId: parsed.tableId,
    tableLabel: parsed.tableLabel,
    customerName: parsed.customerName || (parsed.tableLabel ? `Guest (${parsed.tableLabel})` : 'Customer QR'),
    customerPhone: parsed.customerPhone,
    customerEmail: parsed.customerEmail,
    items: formattedItems,
    subtotal: calculatedSubtotal,
    discountTotal: 0,
    taxTotal: cgst + sgst,
    cgst,
    sgst,
    serviceChargeTotal,
    grandTotal,
    notes: parsed.notes,
    createdBy: 'customer-qr',
    createdByName: parsed.customerName || (parsed.tableLabel ? `Guest (${parsed.tableLabel})` : 'Customer QR'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    paymentStatus: parsed.paymentStatus || 'pending',
    paymentMethod: parsed.paymentMethod || 'cash',
  };

  // Upsert order in database
  const existingIndex = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderNumber);
  if (existingIndex >= 0) {
    orders[existingIndex] = newOrder;
  } else {
    orders.unshift(newOrder);
  }

  // Handle Kitchen Tickets
  const dispatchedTickets: any[] = [];
  if (Array.isArray(parsed.tickets) && parsed.tickets.length > 0) {
    parsed.tickets.forEach((ct: any) => {
      const ticketObj = {
        ...ct,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        tableLabel: newOrder.tableLabel,
        orderType: newOrder.orderType,
      };
      kitchenTickets.unshift(ticketObj);
      dispatchedTickets.push(ticketObj);
      io.emit('kitchen.ticket_created', ticketObj);
    });
  } else {
    const defaultTicket = {
      id: `kt-${Date.now()}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      tableLabel: newOrder.tableLabel,
      orderType: newOrder.orderType,
      station: 'kitchen',
      status: 'pending',
      items: formattedItems.map((fi: any) => ({
        name: fi.name,
        quantity: fi.quantity,
        notes: fi.notes,
        modifiers: (fi.modifiers || []).map((m: any) => (typeof m === 'string' ? m : m.name)),
      })),
      orderNotes: parsed.notes,
      createdAt: new Date().toISOString(),
    };
    kitchenTickets.unshift(defaultTicket);
    dispatchedTickets.push(defaultTicket);
    io.emit('kitchen.ticket_created', defaultTicket);
  }

  // Real-time broadcast complete Order via Socket.IO
  io.emit('order.created', newOrder);

  const responsePayload = {
    data: newOrder,
    tickets: dispatchedTickets,
    meta: { requestId: `req-${Date.now()}` },
  };

  if (idempotencyKey) {
    idempotencyStore.set(idempotencyKey, responsePayload);
  }

  res.status(201).json(responsePayload);
});

app.get('/api/v1/branches/:branchId/orders', (_req: Request, res: Response) => {
  res.json({ data: orders });
});

app.get('/api/v1/orders/:orderId', (req: Request, res: Response) => {
  const ord = orders.find((o) => o.id === req.params.orderId);
  if (!ord) return res.status(404).json({ error: 'Order not found' });
  res.json({ data: ord });
});

// 6. Kitchen Tickets
app.get('/api/v1/kitchen/tickets', (_req: Request, res: Response) => {
  res.json({ data: kitchenTickets });
});

app.patch('/api/v1/kitchen/tickets/:ticketId/status', (req: Request, res: Response) => {
  const validationResult = UpdateTicketStatusSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      error: 'Invalid ticket status update',
      details: validationResult.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
  }

  const { status } = validationResult.data;
  let targetTicket = kitchenTickets.find((kt) => kt.id === req.params.ticketId);

  if (!targetTicket) {
    targetTicket = {
      id: req.params.ticketId,
      status,
      updatedAt: new Date().toISOString(),
    };
    kitchenTickets.unshift(targetTicket);
  } else {
    targetTicket.status = status;
    targetTicket.updatedAt = new Date().toISOString();
  }

  io.emit('kitchen.ticket_updated', targetTicket);
  res.json({ data: targetTicket });
});

// 7. Payments (Rate limited & strictly validated)
app.post('/api/v1/orders/:orderId/payments', paymentRateLimiter, (req: Request, res: Response) => {
  const validationResult = CreatePaymentSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      error: 'Invalid payment payload',
      details: validationResult.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
  }

  const { method, amount, tenderedAmount } = validationResult.data;
  const targetOrder = orders.find((o) => o.id === req.params.orderId);

  if (!targetOrder) {
    return res.status(404).json({ error: `Order with ID ${req.params.orderId} not found` });
  }

  const paymentRecord = {
    id: `pay-${Date.now()}`,
    orderId: req.params.orderId,
    method,
    amount,
    tenderedAmount: tenderedAmount || amount,
    status: 'succeeded',
    createdAt: new Date().toISOString(),
  };

  targetOrder.status = 'completed';
  targetOrder.paymentStatus = 'succeeded';
  targetOrder.paymentMethod = method;
  targetOrder.payments = [...(targetOrder.payments || []), paymentRecord];
  targetOrder.updatedAt = new Date().toISOString();

  // Authoritatively broadcast verified payment status from server
  io.emit('payment.status_changed', paymentRecord);
  res.json({ data: paymentRecord, order: targetOrder });
});

// 8. Inventory
app.get('/api/v1/branches/:branchId/inventory', (_req: Request, res: Response) => {
  res.json({ data: inventory });
});

// 9. Reports
app.get('/api/v1/reports/sales', (_req: Request, res: Response) => {
  const totalGross = orders.filter((o) => o.paymentStatus === 'succeeded').reduce((s, o) => s + o.grandTotal, 0);
  res.json({
    data: {
      totalGrossSales: totalGross,
      totalOrders: orders.length,
      branch: currentBranch.name,
    },
  });
});

// 10. Audit Trail
app.get('/api/v1/audit-events', (_req: Request, res: Response) => {
  res.json({ data: auditEvents });
});

// Socket.IO Realtime Gateway with Event Integrity & Authorization Checks
io.on('connection', (socket) => {
  const clientAddress = socket.handshake.address;
  socket.emit('connected', { message: 'ORDRIVA Real-time Gateway connected' });

  // Relay client-emitted events with structure validation
  socket.on('order.created', (incomingOrder) => {
    if (incomingOrder && typeof incomingOrder === 'object' && incomingOrder.id && Array.isArray(incomingOrder.items)) {
      socket.broadcast.emit('order.created', incomingOrder);
    }
  });

  socket.on('kitchen.ticket_created', (ticket) => {
    if (ticket && typeof ticket === 'object' && ticket.id && Array.isArray(ticket.items)) {
      socket.broadcast.emit('kitchen.ticket_created', ticket);
    }
  });

  socket.on('kitchen.ticket_updated', (ticket) => {
    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
    if (ticket && typeof ticket === 'object' && ticket.id && validStatuses.includes(ticket.status)) {
      const existing = kitchenTickets.find((kt) => kt.id === ticket.id);
      if (existing) {
        existing.status = ticket.status;
        existing.updatedAt = new Date().toISOString();
      }
      socket.broadcast.emit('kitchen.ticket_updated', ticket);
    }
  });

  // Guard: payments must reference an existing order in database
  socket.on('payment.status_changed', (paymentRecord) => {
    if (paymentRecord && typeof paymentRecord === 'object' && paymentRecord.orderId) {
      const targetOrder = orders.find((o) => o.id === paymentRecord.orderId);
      if (targetOrder) {
        socket.broadcast.emit('payment.status_changed', paymentRecord);
      } else {
        console.warn(`[Socket Security] Rejected unauthorized payment broadcast from ${clientAddress} for order: ${paymentRecord.orderId}`);
      }
    }
  });
});

// Centralized Generic Error Handler (prevents stack traces and sensitive error exposure)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ORDRIVA API Error]', err.message || err);
  const statusCode = typeof err.status === 'number' ? err.status : 500;
  res.status(statusCode).json({
    error: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : (err.message || 'An unexpected error occurred'),
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[ORDRIVA API] Server listening on http://localhost:${PORT}`);
});
