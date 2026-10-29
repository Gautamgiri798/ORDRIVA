// prisma/seed.ts - Database Seed script for ORDRIVA POS
// Seeds Organization, Branch, Roles, Staff Users, Menu, Tables, and Inventory

export const SEED_DATA = {
  organization: {
    id: "org-ordriva-01",
    name: "ORDRIVA Hospitality Group",
    slug: "ordriva-group",
    status: "active"
  },
  branch: {
    id: "branch-downtown-01",
    name: "ORDRIVA Bistro & Grill - Downtown",
    code: "ORD-DT-01",
    address: "Plot 42, Connaught Plaza, Sector 18, New Delhi, India",
    phone: "+91 98765 43210",
    gstin: "07AABCO1234F1Z8",
    timezone: "Asia/Kolkata",
    currency: "INR",
    taxRates: {
      cgst: 2.5,
      sgst: 2.5,
      serviceCharge: 5.0
    }
  },
  users: [
    {
      id: "user-admin-01",
      name: "Vikram Malhotra",
      email: "admin@ordriva.com",
      role: "admin",
      status: "active"
    },
    {
      id: "user-mgr-01",
      name: "Pooja Sharma",
      email: "manager@ordriva.com",
      role: "manager",
      status: "active"
    },
    {
      id: "user-cashier-01",
      name: "Rahul Verma",
      email: "cashier@ordriva.com",
      role: "cashier",
      status: "active"
    },
    {
      id: "user-waiter-01",
      name: "Amit Patel",
      email: "waiter@ordriva.com",
      role: "waiter",
      status: "active"
    },
    {
      id: "user-chef-01",
      name: "Chef Marco Kapoor",
      email: "kitchen@ordriva.com",
      role: "kitchen",
      status: "active"
    },
    {
      id: "user-inventory-01",
      name: "Suresh Gupta",
      email: "inventory@ordriva.com",
      role: "inventory",
      status: "active"
    }
  ],
  categories: [
    { id: "cat-starters", name: "Starters & Small Plates", sortOrder: 1, icon: "Soup", color: "orange" },
    { id: "cat-pizza", name: "Woodfired Artisanal Pizzas", sortOrder: 2, icon: "Pizza", color: "amber" },
    { id: "cat-burgers", name: "Gourmet Burgers & Wraps", sortOrder: 3, icon: "Sandwich", color: "yellow" },
    { id: "cat-mains", name: "Chef's Entrees & Mains", sortOrder: 4, icon: "Utensils", color: "emerald" },
    { id: "cat-drinks", name: "Craft Mocktails & Coffee", sortOrder: 5, icon: "Coffee", color: "blue" },
    { id: "cat-desserts", name: "Decadent Desserts", sortOrder: 6, icon: "Cake", color: "rose" }
  ],
  tables: [
    { id: "tbl-01", label: "T-01", section: "Main Dining", capacity: 2, status: "available" },
    { id: "tbl-02", label: "T-02", section: "Main Dining", capacity: 4, status: "occupied", activeOrderId: "ord-demo-01", seatedAt: "2026-10-29T19:45:00Z" },
    { id: "tbl-03", label: "T-03", section: "Main Dining", capacity: 4, status: "available" },
    { id: "tbl-04", label: "T-04", section: "Main Dining", capacity: 6, status: "reserved" },
    { id: "tbl-05", label: "T-05", section: "Main Dining", capacity: 6, status: "available" },
    { id: "tbl-06", label: "T-06", section: "Garden Terrace", capacity: 2, status: "occupied", activeOrderId: "ord-demo-02", seatedAt: "2026-10-29T20:10:00Z" },
    { id: "tbl-07", label: "T-07", section: "Garden Terrace", capacity: 4, status: "available" },
    { id: "tbl-08", label: "T-08", section: "Garden Terrace", capacity: 4, status: "billed", activeOrderId: "ord-demo-03", seatedAt: "2026-10-29T19:20:00Z" },
    { id: "tbl-09", label: "VIP-1", section: "VIP Lounge", capacity: 8, status: "available" },
    { id: "tbl-10", label: "VIP-2", section: "VIP Lounge", capacity: 10, status: "available" }
  ],
  menuItems: [
    {
      id: "item-01",
      categoryId: "cat-starters",
      name: "Truffle Parmesan Fries",
      description: "Hand-cut Idaho potatoes tossed in white truffle oil, rosemary, parmesan and garlic aioli.",
      price: 290,
      taxRate: 5,
      isVeg: true,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60",
      station: "kitchen",
      modifierGroups: [
        {
          id: "mod-dip",
          name: "Choice of Dip",
          required: false,
          minSelections: 0,
          maxSelections: 2,
          options: [
            { id: "dip-aioli", name: "Truffle Aioli", priceDelta: 40 },
            { id: "dip-peri", name: "Peri Peri Mayo", priceDelta: 30 },
            { id: "dip-cheese", name: "Melted Cheddar Sauce", priceDelta: 60 }
          ]
        }
      ]
    },
    {
      id: "item-02",
      categoryId: "cat-starters",
      name: "Paneer Tikka Crostini",
      description: "Char-grilled tandoori spiced cottage cheese atop toasted sourdough with mint foam.",
      price: 360,
      taxRate: 5,
      isVeg: true,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60",
      station: "kitchen"
    },
    {
      id: "item-03",
      categoryId: "cat-starters",
      name: "Crispy Calamari & Gambas",
      description: "Flash-fried salt & pepper squid and prawns with lime-chili glaze.",
      price: 490,
      taxRate: 5,
      isVeg: false,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60",
      station: "kitchen"
    },
    {
      id: "item-04",
      categoryId: "cat-pizza",
      name: "Artisanal Margherita",
      description: "San Marzano tomato coulis, fresh buffalo mozzarella, virgin olive oil and hand-torn basil.",
      price: 480,
      taxRate: 5,
      isVeg: true,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=60",
      station: "kitchen",
      modifierGroups: [
        {
          id: "mod-crust",
          name: "Crust Style",
          required: true,
          minSelections: 1,
          maxSelections: 1,
          options: [
            { id: "crust-napoli", name: "Neapolitan Sourdough", priceDelta: 0 },
            { id: "crust-thin", name: "Crispy Thin Crust", priceDelta: 30 },
            { id: "crust-cheese", name: "Cheese Burst Edge", priceDelta: 90 }
          ]
        },
        {
          id: "mod-toppings",
          name: "Extra Toppings",
          required: false,
          minSelections: 0,
          maxSelections: 3,
          options: [
            { id: "top-burrata", name: "Whole Fresh Burrata", priceDelta: 160 },
            { id: "top-olives", name: "Kalamata Olives", priceDelta: 50 },
            { id: "top-jalapenos", name: "Pickled Jalapeños", priceDelta: 40 }
          ]
        }
      ]
    },
    {
      id: "item-05",
      categoryId: "cat-pizza",
      name: "Smoked Chicken & Pesto Pizza",
      description: "Hickory-smoked pulled chicken breast, sun-dried tomatoes, genovese pesto and fior di latte.",
      price: 590,
      taxRate: 5,
      isVeg: false,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60",
      station: "kitchen",
      modifierGroups: [
        {
          id: "mod-crust-2",
          name: "Crust Style",
          required: true,
          minSelections: 1,
          maxSelections: 1,
          options: [
            { id: "crust-napoli", name: "Neapolitan Sourdough", priceDelta: 0 },
            { id: "crust-cheese", name: "Cheese Burst Edge", priceDelta: 90 }
          ]
        }
      ]
    },
    {
      id: "item-06",
      categoryId: "cat-pizza",
      name: "Wild Mushroom & Truffle Oil Pizza",
      description: "Roasted shiitake, button and porcini mushrooms, creamy fontina and aged balsamic reduction.",
      price: 560,
      taxRate: 5,
      isVeg: true,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60",
      station: "kitchen"
    },
    {
      id: "item-07",
      categoryId: "cat-burgers",
      name: "ORDRIVA Prime Smash Burger",
      description: "Double tenderloin smashed patties, melted aged cheddar, caramelized shallots, house secret sauce.",
      price: 490,
      taxRate: 5,
      isVeg: false,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60",
      station: "grill",
      modifierGroups: [
        {
          id: "mod-bacon",
          name: "Add-ons",
          required: false,
          minSelections: 0,
          maxSelections: 2,
          options: [
            { id: "add-egg", name: "Fried Farm Egg", priceDelta: 50 },
            { id: "add-cheese", name: "Double Cheddar Slice", priceDelta: 60 }
          ]
        }
      ]
    },
    {
      id: "item-08",
      categoryId: "cat-burgers",
      name: "Avocado & Crispy Halloumi Burger",
      description: "Seared halloumi cheese block, Hass avocado smash, pickled red onion, brioche bun.",
      price: 440,
      taxRate: 5,
      isVeg: true,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=500&auto=format&fit=crop&q=60",
      station: "grill"
    },
    {
      id: "item-09",
      categoryId: "cat-mains",
      name: "Grilled Norwegian Salmon",
      description: "Herb-crusted salmon fillet, asparagus spears, saffron hollandaise and crushed baby potatoes.",
      price: 890,
      taxRate: 5,
      isVeg: false,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&auto=format&fit=crop&q=60",
      station: "kitchen"
    },
    {
      id: "item-10",
      categoryId: "cat-mains",
      name: "Wild Mushroom & Asparagus Risotto",
      description: "Arborio rice slow-cooked in parmesan broth with porcini puree, white wine and microgreens.",
      price: 520,
      taxRate: 5,
      isVeg: true,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=500&auto=format&fit=crop&q=60",
      station: "kitchen"
    },
    {
      id: "item-11",
      categoryId: "cat-drinks",
      name: "Blueberry Basil Smash Mocktail",
      description: "Muddled wild blueberries, fresh sweet basil, crushed ice, cold-pressed lime and club soda.",
      price: 240,
      taxRate: 5,
      isVeg: true,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60",
      station: "bar"
    },
    {
      id: "item-12",
      categoryId: "cat-drinks",
      name: "Single-Estate Cold Brew Coffee",
      description: "16-hour slow steep Arabica roast served over crystal clear ice rock with orange zest.",
      price: 220,
      taxRate: 5,
      isVeg: true,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60",
      station: "bar"
    },
    {
      id: "item-13",
      categoryId: "cat-desserts",
      name: "Valrhona Dark Chocolate Fondant",
      description: "Warm molten chocolate cake centered with 70% dark ganache, paired with Madagascar vanilla bean gelato.",
      price: 360,
      taxRate: 5,
      isVeg: true,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60",
      station: "kitchen"
    },
    {
      id: "item-14",
      categoryId: "cat-desserts",
      name: "Classic Italian Tiramisu",
      description: "Savoiardi ladyfingers soaked in espresso liqueur, whipped mascarpone cream and dusted Dutch cocoa.",
      price: 340,
      taxRate: 5,
      isVeg: true,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=60",
      station: "kitchen"
    }
  ],
  inventory: [
    { id: "inv-01", name: "Artisan Pizza Flour", unit: "kg", currentStock: 85.0, minReorderLevel: 25.0, costPerUnit: 75.0, category: "Dry Goods" },
    { id: "inv-02", name: "Buffalo Mozzarella", unit: "kg", currentStock: 18.5, minReorderLevel: 10.0, costPerUnit: 480.0, category: "Dairy" },
    { id: "inv-03", name: "San Marzano Crushed Tomatoes", unit: "kg", currentStock: 42.0, minReorderLevel: 15.0, costPerUnit: 180.0, category: "Canned Goods" },
    { id: "inv-04", name: "White Truffle Infused Oil", unit: "l", currentStock: 3.2, minReorderLevel: 2.0, costPerUnit: 2200.0, category: "Oils" },
    { id: "inv-05", name: "Fresh Sweet Basil", unit: "kg", currentStock: 1.8, minReorderLevel: 2.0, costPerUnit: 350.0, category: "Produce" }, // Alert: Below reorder
    { id: "inv-06", name: "Chicken Breast Boneless", unit: "kg", currentStock: 22.0, minReorderLevel: 10.0, costPerUnit: 260.0, category: "Meat" },
    { id: "inv-07", name: "Salmon Fillets", unit: "kg", currentStock: 6.5, minReorderLevel: 5.0, costPerUnit: 1450.0, category: "Seafood" },
    { id: "inv-08", name: "Fresh Dairy Milk", unit: "l", currentStock: 28.0, minReorderLevel: 15.0, costPerUnit: 65.0, category: "Dairy" },
    { id: "inv-09", name: "Arabica Coffee Beans", unit: "kg", currentStock: 14.0, minReorderLevel: 8.0, costPerUnit: 850.0, category: "Beverage" },
    { id: "inv-10", name: "French Brioche Buns", unit: "pcs", currentStock: 48.0, minReorderLevel: 30.0, costPerUnit: 22.0, category: "Bakery" }
  ]
};

