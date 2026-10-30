'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Branch,
  MenuCategory,
  MenuItem,
  DiningTable,
  Order,
  OrderItemSnapshot,
  KitchenTicket,
  InventoryItem,
  StockMovement,
  AuditEvent,
  UserRole,
  OrderType,
  PaymentMethod,
  PaymentRecord,
  SelectedModifier,
} from '@/types';

// Deterministic baseline timestamp for seed data to guarantee 100% hydration match
const DEMO_BASE_TIME = 1793290000000;

const INITIAL_USERS: User[] = [
  { id: 'usr-admin', name: 'Vikram Malhotra', email: 'admin@ordriva.com', role: 'admin', branchId: 'br-dt-01', status: 'active' },
  { id: 'usr-mgr', name: 'Pooja Sharma', email: 'manager@ordriva.com', role: 'manager', branchId: 'br-dt-01', status: 'active' },
  { id: 'usr-cashier', name: 'Rahul Verma', email: 'cashier@ordriva.com', role: 'cashier', branchId: 'br-dt-01', status: 'active' },
  { id: 'usr-waiter', name: 'Amit Patel', email: 'waiter@ordriva.com', role: 'waiter', branchId: 'br-dt-01', status: 'active' },
  { id: 'usr-chef', name: 'Chef Marco Kapoor', email: 'kitchen@ordriva.com', role: 'kitchen', branchId: 'br-dt-01', status: 'active' },
  { id: 'usr-inventory', name: 'Suresh Gupta', email: 'inventory@ordriva.com', role: 'inventory', branchId: 'br-dt-01', status: 'active' },
];

const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br-dt-01',
    organizationId: 'org-ordriva',
    name: 'ORDRIVA Bistro & Grill - Downtown',
    code: 'ORD-DT-01',
    address: 'Plot 42, Connaught Plaza, Sector 18, New Delhi',
    phone: '+91 98765 43210',
    gstin: '07AABCO1234F1Z8',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    taxRates: { cgst: 2.5, sgst: 2.5, serviceCharge: 5.0 },
  },
  {
    id: 'br-roof-02',
    organizationId: 'org-ordriva',
    name: 'ORDRIVA Sky Lounge - Aerocity',
    code: 'ORD-SKY-02',
    address: 'Level 12, Worldmark 3, Aerocity, New Delhi',
    phone: '+91 98765 43211',
    gstin: '07AABCO1234F1Z8',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    taxRates: { cgst: 2.5, sgst: 2.5, serviceCharge: 7.5 },
  },
];

const INITIAL_CATEGORIES: MenuCategory[] = [
  { id: 'cat-starters', branchId: 'br-dt-01', name: 'Starters & Small Plates', sortOrder: 1, icon: 'Soup', color: 'orange' },
  { id: 'cat-pizza', branchId: 'br-dt-01', name: 'Woodfired Artisanal Pizzas', sortOrder: 2, icon: 'Pizza', color: 'amber' },
  { id: 'cat-burgers', branchId: 'br-dt-01', name: 'Gourmet Burgers & Wraps', sortOrder: 3, icon: 'Sandwich', color: 'yellow' },
  { id: 'cat-mains', branchId: 'br-dt-01', name: "Chef's Entrees & Mains", sortOrder: 4, icon: 'Utensils', color: 'emerald' },
  { id: 'cat-drinks', branchId: 'br-dt-01', name: 'Craft Mocktails & Coffee', sortOrder: 5, icon: 'Coffee', color: 'blue' },
  { id: 'cat-desserts', branchId: 'br-dt-01', name: 'Decadent Desserts', sortOrder: 6, icon: 'Cake', color: 'rose' },
];

const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item-01',
    branchId: 'br-dt-01',
    categoryId: 'cat-starters',
    name: 'Truffle Parmesan Fries',
    description: 'Crispy skin-on fries tossed in Italian white truffle oil, grated parmesan and chopped parsley.',
    price: 290,
    taxRate: 5,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60',
    station: 'kitchen',
    modifierGroups: [
      {
        id: 'mod-dip',
        name: 'Choice of Dip',
        required: false,
        minSelections: 0,
        maxSelections: 2,
        options: [
          { id: 'dip-aioli', name: 'Truffle Aioli', priceDelta: 40 },
          { id: 'dip-peri', name: 'Peri Peri Mayo', priceDelta: 30 },
          { id: 'dip-cheese', name: 'Melted Cheddar Sauce', priceDelta: 60 },
        ],
      },
    ],
    recipe: [{ ingredientId: 'inv-04', quantity: 0.02 }],
  },
  {
    id: 'item-02',
    branchId: 'br-dt-01',
    categoryId: 'cat-starters',
    name: 'Paneer Tikka Crostini',
    description: 'Char-grilled tandoori spiced cottage cheese atop toasted sourdough with mint foam.',
    price: 360,
    taxRate: 5,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60',
    station: 'kitchen',
    recipe: [{ ingredientId: 'inv-05', quantity: 0.05 }],
  },
  {
    id: 'item-03',
    branchId: 'br-dt-01',
    categoryId: 'cat-starters',
    name: 'Crispy Calamari & Gambas',
    description: 'Flash-fried salt & pepper calamari and tiger prawns with chili-lime glaze.',
    price: 490,
    taxRate: 5,
    isVeg: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60',
    station: 'kitchen',
  },
  {
    id: 'item-04',
    branchId: 'br-dt-01',
    categoryId: 'cat-pizza',
    name: 'Artisanal Margherita',
    description: 'San Marzano tomato coulis, fresh buffalo mozzarella, virgin olive oil and hand-torn basil.',
    price: 480,
    taxRate: 5,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=60',
    station: 'kitchen',
    modifierGroups: [
      {
        id: 'mod-crust',
        name: 'Crust Style',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: 'crust-napoli', name: 'Neapolitan Sourdough', priceDelta: 0 },
          { id: 'crust-thin', name: 'Crispy Thin Crust', priceDelta: 30 },
          { id: 'crust-cheese', name: 'Cheese Burst Edge', priceDelta: 90 },
        ],
      },
      {
        id: 'mod-toppings',
        name: 'Extra Toppings',
        required: false,
        minSelections: 0,
        maxSelections: 3,
        options: [
          { id: 'top-burrata', name: 'Whole Fresh Burrata', priceDelta: 160 },
          { id: 'top-olives', name: 'Kalamata Olives', priceDelta: 50 },
          { id: 'top-jalapenos', name: 'Pickled Jalapeños', priceDelta: 40 },
        ],
      },
    ],
    recipe: [
      { ingredientId: 'inv-01', quantity: 0.18 },
      { ingredientId: 'inv-02', quantity: 0.12 },
      { ingredientId: 'inv-03', quantity: 0.08 },
      { ingredientId: 'inv-05', quantity: 0.02 },
    ],
  },
  {
    id: 'item-05',
    branchId: 'br-dt-01',
    categoryId: 'cat-pizza',
    name: 'Smoked Chicken & Pesto Pizza',
    description: 'Hickory-smoked pulled chicken breast, sun-dried tomatoes, genovese pesto and fior di latte.',
    price: 590,
    taxRate: 5,
    isVeg: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
    station: 'kitchen',
    recipe: [
      { ingredientId: 'inv-01', quantity: 0.18 },
      { ingredientId: 'inv-02', quantity: 0.1 },
      { ingredientId: 'inv-06', quantity: 0.15 },
    ],
  },
  {
    id: 'item-06',
    branchId: 'br-dt-01',
    categoryId: 'cat-burgers',
    name: 'ORDRIVA Prime Smash Burger',
    description: 'Double tenderloin smash patties, melted aged cheddar, caramelized onions, secret sauce.',
    price: 490,
    taxRate: 5,
    isVeg: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
    station: 'grill',
    modifierGroups: [
      {
        id: 'mod-add',
        name: 'Add-ons',
        required: false,
        minSelections: 0,
        maxSelections: 2,
        options: [
          { id: 'add-egg', name: 'Fried Farm Egg', priceDelta: 50 },
          { id: 'add-cheese', name: 'Extra Cheddar Slice', priceDelta: 60 },
        ],
      },
    ],
    recipe: [{ ingredientId: 'inv-10', quantity: 1 }],
  },
  {
    id: 'item-07',
    branchId: 'br-dt-01',
    categoryId: 'cat-burgers',
    name: 'Avocado & Halloumi Burger',
    description: 'Crispy pan-seared halloumi cheese block, Haas avocado smash, pickled red onion, brioche bun.',
    price: 440,
    taxRate: 5,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=500&auto=format&fit=crop&q=60',
    station: 'grill',
    recipe: [{ ingredientId: 'inv-10', quantity: 1 }],
  },
  {
    id: 'item-08',
    branchId: 'br-dt-01',
    categoryId: 'cat-mains',
    name: 'Grilled Norwegian Salmon',
    description: 'Herb-crusted salmon fillet, asparagus spears, saffron hollandaise and crushed baby potatoes.',
    price: 890,
    taxRate: 5,
    isVeg: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&auto=format&fit=crop&q=60',
    station: 'kitchen',
    recipe: [{ ingredientId: 'inv-07', quantity: 0.22 }],
  },
  {
    id: 'item-09',
    branchId: 'br-dt-01',
    categoryId: 'cat-drinks',
    name: 'Blueberry Basil Smash',
    description: 'Muddled fresh blueberries, sweet basil, crushed ice, cold-pressed lime and sparkling soda.',
    price: 240,
    taxRate: 5,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60',
    station: 'bar',
  },
  {
    id: 'item-10',
    branchId: 'br-dt-01',
    categoryId: 'cat-drinks',
    name: 'Single-Estate Cold Brew',
    description: '16-hour slow steep Arabica roast served over crystal clear ice rock with orange zest.',
    price: 220,
    taxRate: 5,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60',
    station: 'bar',
    recipe: [{ ingredientId: 'inv-09', quantity: 0.03 }],
  },
  {
    id: 'item-11',
    branchId: 'br-dt-01',
    categoryId: 'cat-desserts',
    name: 'Valrhona Dark Chocolate Fondant',
    description: 'Warm molten chocolate cake centered with 70% dark ganache, paired with vanilla bean gelato.',
    price: 360,
    taxRate: 5,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60',
    station: 'kitchen',
  },
  {
    id: 'item-12',
    branchId: 'br-dt-01',
    categoryId: 'cat-desserts',
    name: 'Classic Italian Tiramisu',
    description: 'Savoiardi ladyfingers soaked in espresso liqueur, whipped mascarpone cream and dusted Dutch cocoa.',
    price: 340,
    taxRate: 5,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=60',
    station: 'kitchen',
  },
];

const INITIAL_TABLES: DiningTable[] = [
  { id: 'tbl-01', branchId: 'br-dt-01', label: 'T-01', section: 'Main Dining', capacity: 2, status: 'available' },
  { id: 'tbl-02', branchId: 'br-dt-01', label: 'T-02', section: 'Main Dining', capacity: 4, status: 'occupied', activeOrderId: 'ord-1001', seatedAt: new Date(DEMO_BASE_TIME - 42 * 60000).toISOString() },
  { id: 'tbl-03', branchId: 'br-dt-01', label: 'T-03', section: 'Main Dining', capacity: 4, status: 'available' },
  { id: 'tbl-04', branchId: 'br-dt-01', label: 'T-04', section: 'Main Dining', capacity: 6, status: 'reserved' },
  { id: 'tbl-05', branchId: 'br-dt-01', label: 'T-05', section: 'Main Dining', capacity: 6, status: 'available' },
  { id: 'tbl-06', branchId: 'br-dt-01', label: 'T-06', section: 'Garden Terrace', capacity: 2, status: 'occupied', activeOrderId: 'ord-1002', seatedAt: new Date(DEMO_BASE_TIME - 18 * 60000).toISOString() },
  { id: 'tbl-07', branchId: 'br-dt-01', label: 'T-07', section: 'Garden Terrace', capacity: 4, status: 'available' },
  { id: 'tbl-08', branchId: 'br-dt-01', label: 'T-08', section: 'Garden Terrace', capacity: 4, status: 'billed', activeOrderId: 'ord-1003', seatedAt: new Date(DEMO_BASE_TIME - 55 * 60000).toISOString() },
  { id: 'tbl-09', branchId: 'br-dt-01', label: 'VIP-1', section: 'VIP Lounge', capacity: 8, status: 'available' },
  { id: 'tbl-10', branchId: 'br-dt-01', label: 'VIP-2', section: 'VIP Lounge', capacity: 10, status: 'available' },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-01', branchId: 'br-dt-01', name: 'Artisan Pizza Flour', unit: 'kg', currentStock: 74.2, minReorderLevel: 25.0, costPerUnit: 75.0, category: 'Dry Goods', lastUpdated: new Date(DEMO_BASE_TIME).toISOString() },
  { id: 'inv-02', branchId: 'br-dt-01', name: 'Buffalo Mozzarella', unit: 'kg', currentStock: 16.8, minReorderLevel: 10.0, costPerUnit: 480.0, category: 'Dairy', lastUpdated: new Date(DEMO_BASE_TIME).toISOString() },
  { id: 'inv-03', branchId: 'br-dt-01', name: 'San Marzano Crushed Tomatoes', unit: 'kg', currentStock: 38.5, minReorderLevel: 15.0, costPerUnit: 180.0, category: 'Canned Goods', lastUpdated: new Date(DEMO_BASE_TIME).toISOString() },
  { id: 'inv-04', branchId: 'br-dt-01', name: 'White Truffle Infused Oil', unit: 'l', currentStock: 2.8, minReorderLevel: 2.0, costPerUnit: 2200.0, category: 'Oils', lastUpdated: new Date(DEMO_BASE_TIME).toISOString() },
  { id: 'inv-05', branchId: 'br-dt-01', name: 'Fresh Sweet Basil', unit: 'kg', currentStock: 1.4, minReorderLevel: 2.0, costPerUnit: 350.0, category: 'Produce', lastUpdated: new Date(DEMO_BASE_TIME).toISOString() },
  { id: 'inv-06', branchId: 'br-dt-01', name: 'Chicken Breast Boneless', unit: 'kg', currentStock: 19.5, minReorderLevel: 10.0, costPerUnit: 260.0, category: 'Meat', lastUpdated: new Date(DEMO_BASE_TIME).toISOString() },
  { id: 'inv-07', branchId: 'br-dt-01', name: 'Salmon Fillets', unit: 'kg', currentStock: 5.8, minReorderLevel: 5.0, costPerUnit: 1450.0, category: 'Seafood', lastUpdated: new Date(DEMO_BASE_TIME).toISOString() },
  { id: 'inv-08', branchId: 'br-dt-01', name: 'French Brioche Buns', unit: 'pcs', currentStock: 42.0, minReorderLevel: 30.0, costPerUnit: 22.0, category: 'Bakery', lastUpdated: new Date(DEMO_BASE_TIME).toISOString() },
  { id: 'inv-09', branchId: 'br-dt-01', name: 'Arabica Coffee Beans', unit: 'kg', currentStock: 12.5, minReorderLevel: 8.0, costPerUnit: 850.0, category: 'Beverage', lastUpdated: new Date(DEMO_BASE_TIME).toISOString() },
];

function generateInitialOrders(): Order[] {
  const activeOrders: Order[] = [
    {
      id: 'ord-1001',
      branchId: 'br-dt-01',
      orderNumber: 1001,
      orderType: 'dine_in',
      status: 'preparing',
      tableId: 'tbl-02',
      tableLabel: 'T-02',
      customerName: 'Ananya Roy',
      customerPhone: '+91 98111 22334',
      items: [
        {
          id: 'oi-1',
          menuItemId: 'item-04',
          name: 'Artisanal Margherita',
          basePrice: 480,
          quantity: 1,
          taxRate: 5,
          modifiers: [{ modifierId: 'crust-thin', name: 'Crispy Thin Crust', priceDelta: 30 }],
          itemTotal: 510,
          taxTotal: 25.5,
        },
        {
          id: 'oi-2',
          menuItemId: 'item-09',
          name: 'Blueberry Basil Smash',
          basePrice: 240,
          quantity: 2,
          taxRate: 5,
          modifiers: [],
          itemTotal: 480,
          taxTotal: 24.0,
        },
      ],
      subtotal: 990,
      discountTotal: 0,
      taxTotal: 49.5,
      cgst: 24.75,
      sgst: 24.75,
      serviceChargeTotal: 49.5,
      grandTotal: 1089,
      createdBy: 'usr-waiter',
      createdByName: 'Amit Patel',
      createdAt: new Date(Date.now() - 42 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 42 * 60000).toISOString(),
      paymentStatus: 'pending',
    },
    {
      id: 'ord-1002',
      branchId: 'br-dt-01',
      orderNumber: 1002,
      orderType: 'dine_in',
      status: 'ready',
      tableId: 'tbl-06',
      tableLabel: 'T-06',
      customerName: 'Rohan Mehra',
      customerPhone: '+91 97222 33445',
      items: [
        {
          id: 'oi-3',
          menuItemId: 'item-06',
          name: 'ORDRIVA Prime Smash Burger',
          basePrice: 490,
          quantity: 1,
          taxRate: 5,
          modifiers: [{ modifierId: 'add-cheese', name: 'Extra Cheddar Slice', priceDelta: 60 }],
          itemTotal: 550,
          taxTotal: 27.5,
        },
        {
          id: 'oi-4',
          menuItemId: 'item-01',
          name: 'Truffle Parmesan Fries',
          basePrice: 290,
          quantity: 1,
          taxRate: 5,
          modifiers: [{ modifierId: 'dip-aioli', name: 'Truffle Aioli', priceDelta: 40 }],
          itemTotal: 330,
          taxTotal: 16.5,
        },
      ],
      subtotal: 880,
      discountTotal: 0,
      taxTotal: 44,
      cgst: 22,
      sgst: 22,
      serviceChargeTotal: 44,
      grandTotal: 968,
      createdBy: 'usr-cashier',
      createdByName: 'Rahul Verma',
      createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
      paymentStatus: 'pending',
    },
    {
      id: 'ord-1003',
      branchId: 'br-dt-01',
      orderNumber: 1003,
      orderType: 'dine_in',
      status: 'served',
      tableId: 'tbl-08',
      tableLabel: 'T-08',
      customerName: 'Kavita Chawla',
      customerPhone: '+91 99333 44556',
      items: [
        {
          id: 'oi-5',
          menuItemId: 'item-08',
          name: 'Grilled Norwegian Salmon',
          basePrice: 890,
          quantity: 1,
          taxRate: 5,
          modifiers: [],
          itemTotal: 890,
          taxTotal: 44.5,
        },
        {
          id: 'oi-6',
          menuItemId: 'item-11',
          name: 'Valrhona Dark Chocolate Fondant',
          basePrice: 360,
          quantity: 1,
          taxRate: 5,
          modifiers: [],
          itemTotal: 360,
          taxTotal: 18,
        },
      ],
      subtotal: 1250,
      discountTotal: 125,
      discountType: 'percentage',
      discountValue: 10,
      taxTotal: 56.25,
      cgst: 28.13,
      sgst: 28.12,
      serviceChargeTotal: 56.25,
      grandTotal: 1237.5,
      createdBy: 'usr-waiter',
      createdByName: 'Amit Patel',
      createdAt: new Date(Date.now() - 55 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      paymentStatus: 'pending',
    },
  ];

  const sampleMeals = [
    {
      name: 'Woodfired Pizza & Mocktail Feast',
      subtotal: 1420,
      items: [
        { id: 'hi-1', menuItemId: 'item-04', name: 'Artisanal Margherita', basePrice: 480, quantity: 2, taxRate: 5, modifiers: [], itemTotal: 960, taxTotal: 48 },
        { id: 'hi-2', menuItemId: 'item-09', name: 'Blueberry Basil Smash', basePrice: 240, quantity: 1, taxRate: 5, modifiers: [], itemTotal: 240, taxTotal: 12 },
        { id: 'hi-3', menuItemId: 'item-12', name: 'Arabica Flat White', basePrice: 220, quantity: 1, taxRate: 5, modifiers: [], itemTotal: 220, taxTotal: 11 },
      ],
    },
    {
      name: 'Gourmet Salmon & Dessert Dinner',
      subtotal: 2430,
      items: [
        { id: 'hi-4', menuItemId: 'item-08', name: 'Grilled Norwegian Salmon', basePrice: 890, quantity: 2, taxRate: 5, modifiers: [], itemTotal: 1780, taxTotal: 89 },
        { id: 'hi-5', menuItemId: 'item-01', name: 'Truffle Parmesan Fries', basePrice: 290, quantity: 1, taxRate: 5, modifiers: [], itemTotal: 290, taxTotal: 14.5 },
        { id: 'hi-6', menuItemId: 'item-11', name: 'Valrhona Dark Chocolate Fondant', basePrice: 360, quantity: 1, taxRate: 5, modifiers: [], itemTotal: 360, taxTotal: 18 },
      ],
    },
    {
      name: 'Smash Burgers & Fries Lunch',
      subtotal: 1270,
      items: [
        { id: 'hi-7', menuItemId: 'item-06', name: 'ORDRIVA Prime Smash Burger', basePrice: 490, quantity: 2, taxRate: 5, modifiers: [], itemTotal: 980, taxTotal: 49 },
        { id: 'hi-8', menuItemId: 'item-01', name: 'Truffle Parmesan Fries', basePrice: 290, quantity: 1, taxRate: 5, modifiers: [], itemTotal: 290, taxTotal: 14.5 },
      ],
    },
    {
      name: 'Chef Luxury Tasting Banquet',
      subtotal: 3950,
      items: [
        { id: 'hi-9', menuItemId: 'item-08', name: 'Grilled Norwegian Salmon', basePrice: 890, quantity: 2, taxRate: 5, modifiers: [], itemTotal: 1780, taxTotal: 89 },
        { id: 'hi-10', menuItemId: 'item-04', name: 'Artisanal Margherita', basePrice: 480, quantity: 2, taxRate: 5, modifiers: [], itemTotal: 960, taxTotal: 48 },
        { id: 'hi-11', menuItemId: 'item-01', name: 'Truffle Parmesan Fries', basePrice: 290, quantity: 2, taxRate: 5, modifiers: [], itemTotal: 580, taxTotal: 29 },
        { id: 'hi-12', menuItemId: 'item-11', name: 'Valrhona Dark Chocolate Fondant', basePrice: 360, quantity: 1, taxRate: 5, modifiers: [], itemTotal: 360, taxTotal: 18 },
        { id: 'hi-13', menuItemId: 'item-09', name: 'Blueberry Basil Smash', basePrice: 270, quantity: 1, taxRate: 5, modifiers: [], itemTotal: 270, taxTotal: 13.5 },
      ],
    },
    {
      name: 'Afternoon Tea & Artisanal Fries',
      subtotal: 890,
      items: [
        { id: 'hi-14', menuItemId: 'item-01', name: 'Truffle Parmesan Fries', basePrice: 290, quantity: 1, taxRate: 5, modifiers: [], itemTotal: 290, taxTotal: 14.5 },
        { id: 'hi-15', menuItemId: 'item-09', name: 'Blueberry Basil Smash', basePrice: 240, quantity: 1, taxRate: 5, modifiers: [], itemTotal: 240, taxTotal: 12 },
        { id: 'hi-16', menuItemId: 'item-11', name: 'Valrhona Dark Chocolate Fondant', basePrice: 360, quantity: 1, taxRate: 5, modifiers: [], itemTotal: 360, taxTotal: 18 },
      ],
    },
  ];

  const guestNames = [
    'Priya Sharma',
    'Kabir Singhania',
    'Neha Kapoor',
    'Siddharth Varma',
    'Tara Aluwalia',
    'Aditya Roy',
    'Meera Nair',
    'Devendra Oberoi',
    'Ishita Bose',
    'Arjun Khanna',
    'Rhea Chakraborty',
    'Aman Sethi',
    'Simran Gill',
    'Rajesh Joshi',
    'Tanvi Mathur',
    'Gautam Chopra',
  ];

  const payMethods: PaymentMethod[] = ['upi', 'upi', 'card', 'card', 'cash'];
  const diningTables = ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08', 'VIP-1', 'VIP-2'];

  const historicalOrders: Order[] = [];
  let orderNumberSeq = 1004;

  // Generate 30 past days of realistic restaurant trading data
  for (let day = 0; day < 30; day++) {
    const dateObj = new Date(Date.now() - day * 86400000);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const ordersCount = day === 0 ? 5 : isWeekend ? 8 : 4;

    for (let i = 0; i < ordersCount; i++) {
      const template = sampleMeals[(day * 2 + i) % sampleMeals.length];
      const guest = guestNames[(day * 3 + i) % guestNames.length];
      const method = payMethods[(day + i) % payMethods.length];
      const tableLabel = diningTables[(day * 2 + i) % diningTables.length];

      const subtotal = template.subtotal;
      const discount = i % 3 === 0 ? Math.round(subtotal * 0.1) : 0;
      const taxable = subtotal - discount;
      const cgst = Math.round(taxable * 0.025 * 100) / 100;
      const sgst = Math.round(taxable * 0.025 * 100) / 100;
      const taxTotal = cgst + sgst;
      const serviceCharge = Math.round(taxable * 0.05 * 100) / 100;
      const grandTotal = taxable + taxTotal + serviceCharge;

      const hourOffset = 12 + ((i * 2) % 10);
      const minuteOffset = (i * 17) % 60;
      const orderDate = new Date(dateObj);
      orderDate.setHours(hourOffset, minuteOffset, 0, 0);

      historicalOrders.push({
        id: `ord-hist-${orderNumberSeq}`,
        branchId: 'br-dt-01',
        orderNumber: orderNumberSeq,
        orderType: i % 4 === 0 ? 'takeaway' : 'dine_in',
        status: 'completed',
        paymentStatus: 'succeeded',
        paymentMethod: method,
        tableLabel: i % 4 === 0 ? undefined : tableLabel,
        customerName: guest,
        customerPhone: `+91 98${Math.floor(10000000 + (day * 100 + i) * 12345) % 100000000}`,
        items: template.items.map((it, idx) => ({ ...it, id: `oi-h-${orderNumberSeq}-${idx}` })),
        subtotal,
        discountTotal: discount,
        taxTotal,
        cgst,
        sgst,
        serviceChargeTotal: serviceCharge,
        grandTotal,
        createdBy: 'usr-cashier',
        createdByName: 'Rahul Verma',
        createdAt: orderDate.toISOString(),
        updatedAt: orderDate.toISOString(),
        payments: [
          {
            id: `pay-h-${orderNumberSeq}`,
            orderId: `ord-hist-${orderNumberSeq}`,
            method,
            amount: grandTotal,
            status: 'succeeded',
            createdAt: orderDate.toISOString(),
            providerReference: method === 'upi' ? `UPI-${998877 + orderNumberSeq}` : undefined,
          },
        ],
      });
      orderNumberSeq++;
    }
  }

  return [...activeOrders, ...historicalOrders];
}

const INITIAL_ORDERS: Order[] = generateInitialOrders();

const INITIAL_KITCHEN_TICKETS: KitchenTicket[] = [
  {
    id: 'kt-01',
    orderId: 'ord-1001',
    orderNumber: 1001,
    tableLabel: 'T-02',
    orderType: 'dine_in',
    station: 'kitchen',
    status: 'preparing',
    items: [
      { name: 'Artisanal Margherita', quantity: 1, modifiers: ['Crispy Thin Crust'], notes: 'Crispy well-done crust' },
    ],
    createdAt: new Date(DEMO_BASE_TIME - 40 * 60000).toISOString(),
    startedAt: new Date(DEMO_BASE_TIME - 35 * 60000).toISOString(),
  },
  {
    id: 'kt-02',
    orderId: 'ord-1001',
    orderNumber: 1001,
    tableLabel: 'T-02',
    orderType: 'dine_in',
    station: 'bar',
    status: 'ready',
    items: [{ name: 'Blueberry Basil Smash', quantity: 2, modifiers: [] }],
    createdAt: new Date(DEMO_BASE_TIME - 40 * 60000).toISOString(),
    startedAt: new Date(DEMO_BASE_TIME - 38 * 60000).toISOString(),
    readyAt: new Date(DEMO_BASE_TIME - 30 * 60000).toISOString(),
  },
  {
    id: 'kt-03',
    orderId: 'ord-1002',
    orderNumber: 1002,
    tableLabel: 'T-06',
    orderType: 'dine_in',
    station: 'grill',
    status: 'ready',
    items: [
      { name: 'ORDRIVA Prime Smash Burger', quantity: 1, modifiers: ['Extra Cheddar Slice'] },
      { name: 'Truffle Parmesan Fries', quantity: 1, modifiers: ['Truffle Aioli'] },
    ],
    createdAt: new Date(DEMO_BASE_TIME - 17 * 60000).toISOString(),
    startedAt: new Date(DEMO_BASE_TIME - 15 * 60000).toISOString(),
    readyAt: new Date(DEMO_BASE_TIME - 4 * 60000).toISOString(),
  },
];

const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'aud-01',
    branchId: 'br-dt-01',
    actorId: 'usr-admin',
    actorName: 'Vikram Malhotra',
    actorRole: 'admin',
    action: 'BRANCH_SETUP',
    entityType: 'BRANCH',
    entityId: 'br-dt-01',
    details: { gstin: '07AABCO1234F1Z8', currency: 'INR' },
    timestamp: new Date(DEMO_BASE_TIME - 240 * 60000).toISOString(),
  },
  {
    id: 'aud-02',
    branchId: 'br-dt-01',
    actorId: 'usr-cashier',
    actorName: 'Rahul Verma',
    actorRole: 'cashier',
    action: 'ORDER_PLACED',
    entityType: 'ORDER',
    entityId: 'ord-1002',
    details: { orderNumber: 1002, total: 968 },
    timestamp: new Date(DEMO_BASE_TIME - 18 * 60000).toISOString(),
  },
];

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  notes?: string;
  itemTotal: number;
}

interface PosStoreContextType {
  currentUser: User;
  setCurrentUser: (u: User) => void;
  availableUsers: User[];
  currentBranch: Branch;
  setCurrentBranch: (b: Branch) => void;
  availableBranches: Branch[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  tables: DiningTable[];
  orders: Order[];
  kitchenTickets: KitchenTicket[];
  inventory: InventoryItem[];
  auditLogs: AuditEvent[];
  isOnline: boolean;

  // Cart
  cart: CartItem[];
  selectedTableId: string | null;
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  orderNotes: string;
  discountPercentage: number;
  setSelectedTableId: (id: string | null) => void;
  setOrderType: (t: OrderType) => void;
  setCustomerName: (n: string) => void;
  setCustomerPhone: (p: string) => void;
  setOrderNotes: (n: string) => void;
  setDiscountPercentage: (d: number) => void;
  addToCart: (item: MenuItem, quantity?: number, selectedMods?: SelectedModifier[], notes?: string) => void;
  updateCartItemQty: (index: number, delta: number) => void;
  removeCartItem: (index: number) => void;
  clearCart: () => void;
  cartCalculations: {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    taxTotal: number;
    serviceCharge: number;
    grandTotal: number;
  };

  // Actions
  createOrder: () => Order | null;
  settlePayment: (orderId: string, method: PaymentMethod, tendered?: number, splitData?: any) => { success: boolean; order?: Order };
  refundOrder: (orderId: string, amount: number, reason: string) => boolean;
  updateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  updateKitchenTicketStatus: (ticketId: string, newStatus: KitchenTicket['status']) => void;
  toggleItemAvailability: (itemId: string) => void;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'branchId'> & Partial<Pick<MenuItem, 'id' | 'branchId'>>) => MenuItem;
  deleteMenuItem: (itemId: string) => void;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => void;
  updateTableStatus: (tableId: string, status: DiningTable['status'], orderId?: string) => void;
  logStockAdjustment: (itemId: string, delta: number, type: StockMovement['movementType'], reason: string) => void;
  addAuditEvent: (action: string, entityType: string, entityId: string, details?: Record<string, any>) => void;
  updateBranchTaxSettings: (cgst: number, sgst: number, serviceCharge: number) => void;
}

const PosStoreContext = createContext<PosStoreContextType | null>(null);

export function PosStoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Locked to Admin (Vikram Malhotra)
  const [currentBranch, setCurrentBranch] = useState<Branch>(INITIAL_BRANCHES[0]);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [categories, setCategories] = useState<MenuCategory[]>(INITIAL_CATEGORIES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [tables, setTables] = useState<DiningTable[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [kitchenTickets, setKitchenTickets] = useState<KitchenTicket[]>(INITIAL_KITCHEN_TICKETS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(INITIAL_AUDIT_LOGS);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);

  // Online / Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Restore Branch & Tax Settings from LocalStorage
  useEffect(() => {
    try {
      const savedBranches = localStorage.getItem('ordriva_available_branches');
      const savedCurrentBranch = localStorage.getItem('ordriva_current_branch');
      if (savedBranches) {
        const parsed = JSON.parse(savedBranches);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAvailableBranches(parsed);
        }
      }
      if (savedCurrentBranch) {
        const parsedCurrent = JSON.parse(savedCurrentBranch);
        if (parsedCurrent && parsedCurrent.taxRates) {
          setCurrentBranch(parsedCurrent);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  // Save cart to LocalStorage for offline resilience
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ordriva_active_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.cart)) {
          setCart(parsed.cart);
          setSelectedTableId(parsed.selectedTableId || null);
          setOrderType(parsed.orderType || 'dine_in');
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'ordriva_active_cart',
        JSON.stringify({ cart, selectedTableId, orderType, customerName, customerPhone })
      );
    } catch {
      // Ignored
    }
  }, [cart, selectedTableId, orderType, customerName, customerPhone]);

  // Cart calculations using precise decimal logic
  const calculateCart = () => {
    let subtotal = 0;
    for (const item of cart) {
      subtotal += item.itemTotal * item.quantity;
    }

    const discountAmount = Math.round(((subtotal * discountPercentage) / 100) * 100) / 100;
    const taxableAmount = Math.max(0, subtotal - discountAmount);

    const cgstRate = currentBranch.taxRates.cgst;
    const sgstRate = currentBranch.taxRates.sgst;
    const serviceRate = orderType === 'dine_in' ? currentBranch.taxRates.serviceCharge : 0;

    const cgst = Math.round(((taxableAmount * cgstRate) / 100) * 100) / 100;
    const sgst = Math.round(((taxableAmount * sgstRate) / 100) * 100) / 100;
    const taxTotal = cgst + sgst;
    const serviceCharge = Math.round(((taxableAmount * serviceRate) / 100) * 100) / 100;
    const grandTotal = Math.round((taxableAmount + taxTotal + serviceCharge) * 100) / 100;

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      cgst,
      sgst,
      taxTotal,
      serviceCharge,
      grandTotal,
    };
  };

  const cartCalculations = calculateCart();

  const addToCart = (
    item: MenuItem,
    quantity = 1,
    selectedMods: SelectedModifier[] = [],
    notes = ''
  ) => {
    const modDelta = selectedMods.reduce((sum, m) => sum + m.priceDelta, 0);
    const unitPrice = item.price + modDelta;

    setCart((prev) => {
      // Check for identical item + same modifiers
      const existingIdx = prev.findIndex(
        (ci) =>
          ci.menuItem.id === item.id &&
          JSON.stringify(ci.selectedModifiers) === JSON.stringify(selectedMods) &&
          ci.notes === notes
      );

      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      }

      return [
        ...prev,
        {
          menuItem: item,
          quantity,
          selectedModifiers: selectedMods,
          notes,
          itemTotal: unitPrice,
        },
      ];
    });
  };

  const updateCartItemQty = (index: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev];
      const newQty = next[index].quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== index);
      }
      next[index].quantity = newQty;
      return next;
    });
  };

  const removeCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedTableId(null);
    setCustomerName('');
    setCustomerPhone('');
    setOrderNotes('');
    setDiscountPercentage(0);
  };

  const addAuditEvent = (action: string, entityType: string, entityId: string, details?: Record<string, any>) => {
    const newLog: AuditEvent = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      branchId: currentBranch.id,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      entityType,
      entityId,
      details: details || {},
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const createOrder = (): Order | null => {
    if (cart.length === 0) return null;

    const calculations = calculateCart();
    const nextOrderNum = orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber)) + 1 : 1001;
    const orderId = `ord-${nextOrderNum}`;

    const tableObj = tables.find((t) => t.id === selectedTableId);

    const items: OrderItemSnapshot[] = cart.map((ci, idx) => ({
      id: `oi-${orderId}-${idx + 1}`,
      menuItemId: ci.menuItem.id,
      name: ci.menuItem.name,
      basePrice: ci.menuItem.price,
      quantity: ci.quantity,
      taxRate: ci.menuItem.taxRate,
      modifiers: ci.selectedModifiers,
      itemTotal: ci.itemTotal * ci.quantity,
      taxTotal: Math.round(((ci.itemTotal * ci.quantity * ci.menuItem.taxRate) / 100) * 100) / 100,
      notes: ci.notes,
    }));

    const newOrder: Order = {
      id: orderId,
      branchId: currentBranch.id,
      orderNumber: nextOrderNum,
      orderType,
      status: 'placed',
      tableId: selectedTableId || undefined,
      tableLabel: tableObj ? tableObj.label : undefined,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      items,
      subtotal: calculations.subtotal,
      discountTotal: calculations.discountAmount,
      discountType: discountPercentage > 0 ? 'percentage' : undefined,
      discountValue: discountPercentage > 0 ? discountPercentage : undefined,
      taxTotal: calculations.taxTotal,
      cgst: calculations.cgst,
      sgst: calculations.sgst,
      serviceChargeTotal: calculations.serviceCharge,
      grandTotal: calculations.grandTotal,
      notes: orderNotes || undefined,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentStatus: 'pending',
    };

    // Update table occupancy
    if (selectedTableId) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTableId
            ? { ...t, status: 'occupied', activeOrderId: orderId, seatedAt: new Date().toISOString() }
            : t
        )
      );
    }

    // Auto-create KDS tickets grouped by station
    const kitchenItems = cart.filter((ci) => ci.menuItem.station === 'kitchen' || !ci.menuItem.station);
    const grillItems = cart.filter((ci) => ci.menuItem.station === 'grill');
    const barItems = cart.filter((ci) => ci.menuItem.station === 'bar');

    const newTickets: KitchenTicket[] = [];

    if (kitchenItems.length > 0) {
      newTickets.push({
        id: `kt-${Date.now()}-1`,
        orderId,
        orderNumber: nextOrderNum,
        tableLabel: tableObj?.label,
        orderType,
        station: 'kitchen',
        status: 'pending',
        items: kitchenItems.map((ki) => ({
          name: ki.menuItem.name,
          quantity: ki.quantity,
          notes: ki.notes,
          modifiers: ki.selectedModifiers.map((m) => m.name),
        })),
        orderNotes,
        createdAt: new Date().toISOString(),
      });
    }

    if (grillItems.length > 0) {
      newTickets.push({
        id: `kt-${Date.now()}-2`,
        orderId,
        orderNumber: nextOrderNum,
        tableLabel: tableObj?.label,
        orderType,
        station: 'grill',
        status: 'pending',
        items: grillItems.map((gi) => ({
          name: gi.menuItem.name,
          quantity: gi.quantity,
          notes: gi.notes,
          modifiers: gi.selectedModifiers.map((m) => m.name),
        })),
        orderNotes,
        createdAt: new Date().toISOString(),
      });
    }

    if (barItems.length > 0) {
      newTickets.push({
        id: `kt-${Date.now()}-3`,
        orderId,
        orderNumber: nextOrderNum,
        tableLabel: tableObj?.label,
        orderType,
        station: 'bar',
        status: 'pending',
        items: barItems.map((bi) => ({
          name: bi.menuItem.name,
          quantity: bi.quantity,
          notes: bi.notes,
          modifiers: bi.selectedModifiers.map((m) => m.name),
        })),
        orderNotes,
        createdAt: new Date().toISOString(),
      });
    }

    setKitchenTickets((prev) => [...newTickets, ...prev]);
    setOrders((prev) => [newOrder, ...prev]);

    addAuditEvent('ORDER_CREATED', 'ORDER', orderId, {
      orderNumber: nextOrderNum,
      grandTotal: calculations.grandTotal,
      table: tableObj?.label,
      itemsCount: items.length,
    });

    clearCart();
    return newOrder;
  };

  const settlePayment = (
    orderId: string,
    method: PaymentMethod,
    tendered?: number,
    _splitData?: any
  ): { success: boolean; order?: Order } => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return { success: false };

    const paymentAmount = targetOrder.grandTotal;
    const changeAmount = tendered && tendered >= paymentAmount ? tendered - paymentAmount : 0;

    const paymentRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      orderId,
      method,
      amount: paymentAmount,
      status: 'succeeded',
      providerReference: method === 'upi' ? `UPI-REF-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
      tenderedAmount: tendered,
      changeAmount,
      createdAt: new Date().toISOString(),
    };

    const updatedOrder: Order = {
      ...targetOrder,
      status: 'completed',
      paymentStatus: 'succeeded',
      paymentMethod: method,
      payments: [...(targetOrder.payments || []), paymentRecord],
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));

    // Release table if dine-in
    if (targetOrder.tableId) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === targetOrder.tableId
            ? { ...t, status: 'available', activeOrderId: undefined, seatedAt: undefined }
            : t
        )
      );
    }

    // Auto-deduct inventory according to recipe
    targetOrder.items.forEach((oi) => {
      const originalItem = menuItems.find((mi) => mi.id === oi.menuItemId);
      if (originalItem?.recipe) {
        originalItem.recipe.forEach((rec) => {
          const totalDeduction = rec.quantity * oi.quantity;
          setInventory((prev) =>
            prev.map((inv) =>
              inv.id === rec.ingredientId
                ? {
                    ...inv,
                    currentStock: Math.max(0, Math.round((inv.currentStock - totalDeduction) * 1000) / 1000),
                    lastUpdated: new Date().toISOString(),
                  }
                : inv
            )
          );
        });
      }
    });

    addAuditEvent('PAYMENT_SETTLED', 'ORDER', orderId, {
      method,
      amount: paymentAmount,
      tendered,
      changeAmount,
    });

    return { success: true, order: updatedOrder };
  };

  const refundOrder = (orderId: string, amount: number, reason: string): boolean => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return false;

    if (amount > targetOrder.grandTotal) return false;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              paymentStatus: amount >= o.grandTotal ? 'refunded' : 'partially_refunded',
              status: amount >= o.grandTotal ? 'cancelled' : o.status,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    addAuditEvent('ORDER_REFUNDED', 'ORDER', orderId, { amount, reason });
    return true;
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o))
    );
    addAuditEvent('ORDER_STATUS_CHANGED', 'ORDER', orderId, { newStatus });
  };

  const updateKitchenTicketStatus = (ticketId: string, newStatus: KitchenTicket['status']) => {
    setKitchenTickets((prev) =>
      prev.map((kt) => {
        if (kt.id !== ticketId) return kt;
        const now = new Date().toISOString();
        return {
          ...kt,
          status: newStatus,
          startedAt: newStatus === 'preparing' && !kt.startedAt ? now : kt.startedAt,
          readyAt: newStatus === 'ready' && !kt.readyAt ? now : kt.readyAt,
        };
      })
    );
  };

  const toggleItemAvailability = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item))
    );
    const item = menuItems.find((i) => i.id === itemId);
    if (item) {
      addAuditEvent('ITEM_AVAILABILITY_TOGGLED', 'MENU_ITEM', itemId, {
        name: item.name,
        available: !item.isAvailable,
      });
    }
  };

  const addMenuItem = (
    itemData: Omit<MenuItem, 'id' | 'branchId'> & Partial<Pick<MenuItem, 'id' | 'branchId'>>
  ): MenuItem => {
    const newItem: MenuItem = {
      ...itemData,
      id: itemData.id || `item-${Date.now()}`,
      branchId: itemData.branchId || currentBranch.id,
      isAvailable: itemData.isAvailable ?? true,
      taxRate: itemData.taxRate ?? 5,
    };
    setMenuItems((prev) => [newItem, ...prev]);
    addAuditEvent('MENU_ITEM_ADDED', 'MENU_ITEM', newItem.id, {
      name: newItem.name,
      price: newItem.price,
      category: newItem.categoryId,
    });
    return newItem;
  };

  const deleteMenuItem = (itemId: string) => {
    const item = menuItems.find((i) => i.id === itemId);
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
    if (item) {
      addAuditEvent('MENU_ITEM_DELETED', 'MENU_ITEM', itemId, {
        name: item.name,
      });
    }
  };

  const updateMenuItem = (itemId: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i))
    );
    addAuditEvent('MENU_ITEM_UPDATED', 'MENU_ITEM', itemId, updates);
  };

  const updateTableStatus = (tableId: string, status: DiningTable['status'], orderId?: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status,
              activeOrderId: orderId || (status === 'available' ? undefined : t.activeOrderId),
              seatedAt: status === 'occupied' && !t.seatedAt ? new Date().toISOString() : status === 'available' ? undefined : t.seatedAt,
            }
          : t
      )
    );
  };

  const logStockAdjustment = (
    itemId: string,
    delta: number,
    type: StockMovement['movementType'],
    reason: string
  ) => {
    setInventory((prev) =>
      prev.map((inv) =>
        inv.id === itemId
          ? {
              ...inv,
              currentStock: Math.max(0, Math.round((inv.currentStock + delta) * 1000) / 1000),
              lastUpdated: new Date().toISOString(),
            }
          : inv
      )
    );

    const invItem = inventory.find((i) => i.id === itemId);
    addAuditEvent('STOCK_ADJUSTMENT', 'INVENTORY', itemId, {
      itemName: invItem?.name,
      delta,
      movementType: type,
      reason,
    });
  };

  const updateBranchTaxSettings = (cgst: number, sgst: number, serviceCharge: number) => {
    const updatedRates = { cgst, sgst, serviceCharge };

    setCurrentBranch((prev) => {
      const next = { ...prev, taxRates: updatedRates };
      try {
        localStorage.setItem('ordriva_current_branch', JSON.stringify(next));
      } catch {}
      return next;
    });

    setAvailableBranches((prev) => {
      const next = prev.map((b) => (b.id === currentBranch.id ? { ...b, taxRates: updatedRates } : b));
      try {
        localStorage.setItem('ordriva_available_branches', JSON.stringify(next));
      } catch {}
      return next;
    });

    addAuditEvent('TAX_SETTINGS_UPDATED', 'BRANCH', currentBranch.id, { cgst, sgst, serviceCharge });
  };

  const handleSetCurrentBranch = (b: Branch) => {
    setCurrentBranch(b);
    try {
      localStorage.setItem('ordriva_current_branch', JSON.stringify(b));
    } catch {}
  };

  return (
    <PosStoreContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers: [INITIAL_USERS[0]], // Admin only
        currentBranch,
        setCurrentBranch: handleSetCurrentBranch,
        availableBranches,
        categories,
        menuItems,
        tables,
        orders,
        kitchenTickets,
        inventory,
        auditLogs,
        isOnline,
        cart,
        selectedTableId,
        orderType,
        customerName,
        customerPhone,
        orderNotes,
        discountPercentage,
        setSelectedTableId,
        setOrderType,
        setCustomerName,
        setCustomerPhone,
        setOrderNotes,
        setDiscountPercentage,
        addToCart,
        updateCartItemQty,
        removeCartItem,
        clearCart,
        cartCalculations,
        createOrder,
        settlePayment,
        refundOrder,
        updateOrderStatus,
        updateKitchenTicketStatus,
        toggleItemAvailability,
        addMenuItem,
        deleteMenuItem,
        updateMenuItem,
        updateTableStatus,
        logStockAdjustment,
        addAuditEvent,
        updateBranchTaxSettings,
      }}
    >
      {children}
    </PosStoreContext.Provider>
  );
}

export function usePosStore() {
  const context = useContext(PosStoreContext);
  if (!context) {
    throw new Error('usePosStore must be used within a PosStoreProvider');
  }
  return context;
}

