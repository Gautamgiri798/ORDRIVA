export type UserRole = 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'inventory';

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export type OrderStatus =
  | 'draft'
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'split';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'partially_refunded'
  | 'refunded';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'billed';

export type KitchenStatus = 'pending' | 'preparing' | 'ready' | 'served';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId: string;
  status: 'active' | 'inactive';
}

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  gstin: string;
  timezone: string;
  currency: string;
  taxRates: {
    cgst: number;
    sgst: number;
    serviceCharge: number;
  };
}

export interface MenuCategory {
  id: string;
  branchId: string;
  name: string;
  icon?: string;
  sortOrder: number;
  color?: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  branchId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  taxRate: number;
  isAvailable: boolean;
  imageUrl?: string;
  isVeg: boolean;
  station: 'kitchen' | 'bar' | 'grill';
  modifierGroups?: ModifierGroup[];
  recipe?: { ingredientId: string; quantity: number }[];
}

export interface DiningTable {
  id: string;
  branchId: string;
  label: string;
  section: string;
  capacity: number;
  status: TableStatus;
  activeOrderId?: string;
  seatedAt?: string;
}

export interface SelectedModifier {
  modifierId: string;
  name: string;
  priceDelta: number;
}

export interface OrderItemSnapshot {
  id: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  taxRate: number;
  modifiers: SelectedModifier[];
  itemTotal: number;
  taxTotal: number;
  notes?: string;
  kitchenStatus?: KitchenStatus;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  providerReference?: string;
  tenderedAmount?: number;
  changeAmount?: number;
  upiVpa?: string;
  transactionRef?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  branchId: string;
  orderNumber: number;
  orderType: OrderType;
  status: OrderStatus;
  tableId?: string;
  tableLabel?: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  discountTotal: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  taxTotal: number;
  cgst: number;
  sgst: number;
  serviceChargeTotal: number;
  grandTotal: number;
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  payments?: PaymentRecord[];
}

export interface KitchenTicket {
  id: string;
  orderId: string;
  orderNumber: number;
  tableLabel?: string;
  orderType: OrderType;
  station: 'kitchen' | 'bar' | 'grill';
  status: KitchenStatus;
  items: {
    name: string;
    quantity: number;
    notes?: string;
    modifiers: string[];
  }[];
  orderNotes?: string;
  createdAt: string;
  startedAt?: string;
  readyAt?: string;
}

export interface InventoryItem {
  id: string;
  branchId: string;
  name: string;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs';
  currentStock: number;
  minReorderLevel: number;
  costPerUnit: number;
  category: string;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  movementType: 'purchase' | 'order_consumption' | 'waste' | 'adjustment';
  quantityDelta: number;
  reason?: string;
  orderId?: string;
  recordedBy: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  branchId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  timestamp: string;
}
