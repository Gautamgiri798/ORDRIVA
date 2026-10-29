import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// In-Memory Database store seeded with ORDRIVA default branch
let currentBranch = {
  id: 'br-dt-01',
  name: 'ORDRIVA Bistro & Grill - Downtown',
  gstin: '07AABCO1234F1Z8',
  taxRates: { cgst: 2.5, sgst: 2.5, serviceCharge: 5.0 },
};

let orders: any[] = [];
let kitchenTickets: any[] = [];
let inventory: any[] = [
  { id: 'inv-01', name: 'Artisan Pizza Flour', unit: 'kg', currentStock: 74.2, minReorderLevel: 25.0, costPerUnit: 75.0 },
  { id: 'inv-02', name: 'Buffalo Mozzarella', unit: 'kg', currentStock: 16.8, minReorderLevel: 10.0, costPerUnit: 480.0 },
];
let auditEvents: any[] = [];

// Idempotency cache for preventing double-spend or duplicate orders
const idempotencyStore = new Map<string, any>();

// ----------------------------------------------------
// REST API Endpoints (Section 7.2 of Blueprint)
// ----------------------------------------------------

// 1. Health & Meta
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ORDRIVA POS API', version: '1.0.0', time: new Date().toISOString() });
});

// 2. Auth & User Scopes
app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  // Demo token generator
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

// 5. Orders (with Idempotency validation)
app.post('/api/v1/branches/:branchId/orders', (req: Request, res: Response) => {
  const idempotencyKey = req.header('Idempotency-Key');
  if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
    return res.status(200).json(idempotencyStore.get(idempotencyKey));
  }

  const { orderType, tableId, items, customerName, customerPhone, notes } = req.body;

  const orderNumber = orders.length + 1001;
  const subtotal = (items || []).reduce((acc: number, it: any) => acc + (it.price || 0) * (it.quantity || 1), 0);
  const cgst = Math.round(((subtotal * currentBranch.taxRates.cgst) / 100) * 100) / 100;
  const sgst = Math.round(((subtotal * currentBranch.taxRates.sgst) / 100) * 100) / 100;
  const grandTotal = subtotal + cgst + sgst;

  const newOrder = {
    id: `ord-${orderNumber}`,
    orderNumber,
    orderType: orderType || 'dine_in',
    status: 'placed',
    tableId,
    customerName,
    customerPhone,
    subtotal,
    taxTotal: cgst + sgst,
    cgst,
    sgst,
    grandTotal,
    notes,
    createdAt: new Date().toISOString(),
    paymentStatus: 'pending',
  };

  orders.push(newOrder);

  // KOT Ticket
  const ticket = {
    id: `kt-${Date.now()}`,
    orderId: newOrder.id,
    orderNumber,
    status: 'pending',
    items,
    createdAt: new Date().toISOString(),
  };
  kitchenTickets.push(ticket);

  // Real-time broadcast via Socket.IO
  io.emit('order.created', newOrder);
  io.emit('kitchen.ticket_created', ticket);

  const responsePayload = {
    data: newOrder,
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
  const { status } = req.body;
  const t = kitchenTickets.find((kt) => kt.id === req.params.ticketId);
  if (t) {
    t.status = status;
    io.emit('kitchen.ticket_updated', t);
  }
  res.json({ data: t });
});

// 7. Payments
app.post('/api/v1/orders/:orderId/payments', (req: Request, res: Response) => {
  const { method, amount, tenderedAmount } = req.body;
  const targetOrder = orders.find((o) => o.id === req.params.orderId);
  if (!targetOrder) return res.status(404).json({ error: 'Order not found' });

  targetOrder.status = 'completed';
  targetOrder.paymentStatus = 'succeeded';
  targetOrder.paymentMethod = method;

  const paymentRecord = {
    id: `pay-${Date.now()}`,
    orderId: targetOrder.id,
    method,
    amount,
    tenderedAmount,
    status: 'succeeded',
    createdAt: new Date().toISOString(),
  };

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

// Socket.IO Realtime Connection
io.on('connection', (socket) => {
  socket.emit('connected', { message: 'ORDRIVA Real-time Gateway connected' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[ORDRIVA API] Server listening on http://localhost:${PORT}`);
});
